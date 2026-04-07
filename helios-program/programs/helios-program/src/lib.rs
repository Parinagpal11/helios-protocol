use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("9uqoQXYJP3sgdU6zBBwLx1D1TvoWBN9EPHrK69d8C7F8");

// ─────────────────────────────────────────────────────────────
// HELIOS PROTOCOL — Core On-Chain Program
//
// Instructions:
//   1. initialize_marketplace  — one-time setup
//   2. mint_srec               — oracle calls this when 1 MWh crossed
//   3. list_srec               — producer lists certificate for sale
//   4. purchase_srec           — utility buys, certificate burns atomically
// ─────────────────────────────────────────────────────────────

#[program]
pub mod helios_program {
    use super::*;

    /// One-time marketplace initialization
    pub fn initialize_marketplace(
        ctx: Context<InitializeMarketplace>,
        fee_basis_points: u16, // 50 = 0.5%, 100 = 1%
    ) -> Result<()> {
        let marketplace = &mut ctx.accounts.marketplace;
        marketplace.authority = ctx.accounts.authority.key();
        marketplace.fee_basis_points = fee_basis_points;
        marketplace.total_minted = 0;
        marketplace.total_traded = 0;
        marketplace.bump = ctx.bumps.marketplace;

        emit!(MarketplaceInitialized {
            authority: marketplace.authority,
            fee_basis_points,
        });

        Ok(())
    }

    /// Called by the oracle when a system crosses a 1 MWh threshold.
    /// Creates an SREC record on-chain representing one certificate.
    pub fn mint_srec(
        ctx: Context<MintSrec>,
        params: MintSrecParams,
    ) -> Result<()> {
        require!(
            params.mwh_generated > 0,
            HeliosError::InvalidProduction
        );
        require!(
            params.state.len() <= 4,
            HeliosError::InvalidState
        );

        let srec = &mut ctx.accounts.srec;
        srec.system_id      = params.system_id.clone();
        srec.owner          = ctx.accounts.owner.key();
        srec.state          = params.state.clone();
        srec.vintage_year   = params.vintage_year;
        srec.mwh_generated  = params.mwh_generated;
        srec.status         = SrecStatus::Minted;
        srec.list_price     = 0;
        srec.serial_number  = params.serial_number;
        srec.created_at     = Clock::get()?.unix_timestamp;
        srec.bump           = ctx.bumps.srec;

        // Increment marketplace counter
        let marketplace = &mut ctx.accounts.marketplace;
        marketplace.total_minted += 1;

        emit!(SrecMinted {
            serial_number: srec.serial_number,
            system_id: srec.system_id.clone(),
            owner: srec.owner,
            state: srec.state.clone(),
            vintage_year: srec.vintage_year,
            mwh_generated: srec.mwh_generated,
            timestamp: srec.created_at,
        });

        msg!(
            "SREC minted: #{} | System: {} | State: {} | {}MWh",
            srec.serial_number,
            srec.system_id,
            srec.state,
            srec.mwh_generated
        );

        Ok(())
    }

    /// Producer lists their SREC for sale at a fixed USDC price
    pub fn list_srec(
        ctx: Context<ListSrec>,
        price_usdc_micro: u64, // price in micro-USDC (1 USDC = 1_000_000)
    ) -> Result<()> {
        require!(price_usdc_micro > 0, HeliosError::InvalidPrice);

        let srec = &mut ctx.accounts.srec;
        require!(
            srec.owner == ctx.accounts.owner.key(),
            HeliosError::Unauthorized
        );
        require!(
            srec.status == SrecStatus::Minted,
            HeliosError::AlreadyListed
        );

        srec.status     = SrecStatus::Listed;
        srec.list_price = price_usdc_micro;
        srec.listed_at  = Clock::get()?.unix_timestamp;

        emit!(SrecListed {
            serial_number: srec.serial_number,
            owner: srec.owner,
            price_usdc_micro,
            state: srec.state.clone(),
        });

        msg!(
            "SREC listed: #{} at {} micro-USDC",
            srec.serial_number,
            price_usdc_micro
        );

        Ok(())
    }

    /// Utility purchases an SREC.
    /// USDC transfers from buyer to seller (minus protocol fee).
    /// SREC status flips to Retired — permanently burned from circulation.
    /// This is ATOMIC — either both happen or neither does.
    pub fn purchase_srec(ctx: Context<PurchaseSrec>) -> Result<()> {
        let srec = &mut ctx.accounts.srec;

        require!(
            srec.status == SrecStatus::Listed,
            HeliosError::NotListed
        );
        require!(
            srec.owner != ctx.accounts.buyer.key(),
            HeliosError::CannotBuyOwnSrec
        );

        let price      = srec.list_price;
        let fee_bps    = ctx.accounts.marketplace.fee_basis_points as u64;
        let fee_amount = price * fee_bps / 10_000;
        let seller_amount = price - fee_amount;

        // Transfer USDC: buyer → seller
        let cpi_accounts = Transfer {
            from:      ctx.accounts.buyer_usdc.to_account_info(),
            to:        ctx.accounts.seller_usdc.to_account_info(),
            authority: ctx.accounts.buyer.to_account_info(),
        };
        token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
            seller_amount,
        )?;

        // Transfer USDC: buyer → protocol treasury (fee)
        if fee_amount > 0 {
            let cpi_fee = Transfer {
                from:      ctx.accounts.buyer_usdc.to_account_info(),
                to:        ctx.accounts.treasury_usdc.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            };
            token::transfer(
                CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_fee),
                fee_amount,
            )?;
        }

        // RETIRE the SREC — permanently burned from circulation
        // This is the key anti-double-counting mechanism
        let sale_timestamp = Clock::get()?.unix_timestamp;
        srec.status    = SrecStatus::Retired;
        srec.buyer     = ctx.accounts.buyer.key();
        srec.sold_at   = sale_timestamp;

        // Increment marketplace counter
        let marketplace = &mut ctx.accounts.marketplace;
        marketplace.total_traded += 1;

        emit!(SrecRetired {
            serial_number:  srec.serial_number,
            system_id:      srec.system_id.clone(),
            seller:         srec.owner,
            buyer:          srec.buyer,
            state:          srec.state.clone(),
            vintage_year:   srec.vintage_year,
            price_usdc_micro: price,
            fee_usdc_micro: fee_amount,
            retired_at:     sale_timestamp,
        });

        msg!(
            "SREC RETIRED: #{} | Seller: {} | Buyer: {} | Price: {} USDC | Fee: {}",
            srec.serial_number,
            srec.owner,
            srec.buyer,
            price / 1_000_000,
            fee_amount / 1_000_000
        );

        Ok(())
    }
}

// ─────────────────────────────────────────────────────────────
// ACCOUNTS
// ─────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeMarketplace<'info> {
    #[account(
        init,
        payer = authority,
        space = Marketplace::SIZE,
        seeds = [b"marketplace"],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(params: MintSrecParams)]
pub struct MintSrec<'info> {
    #[account(
        init,
        payer = oracle,
        space = Srec::SIZE,
        seeds = [b"srec", params.serial_number.to_le_bytes().as_ref()],
        bump
    )]
    pub srec: Account<'info, Srec>,

    #[account(
        mut,
        seeds = [b"marketplace"],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,

    /// CHECK: owner wallet — just storing the pubkey
    pub owner: AccountInfo<'info>,

    #[account(mut)]
    pub oracle: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ListSrec<'info> {
    #[account(
        mut,
        seeds = [b"srec", srec.serial_number.to_le_bytes().as_ref()],
        bump = srec.bump
    )]
    pub srec: Account<'info, Srec>,

    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct PurchaseSrec<'info> {
    #[account(
        mut,
        seeds = [b"srec", srec.serial_number.to_le_bytes().as_ref()],
        bump = srec.bump
    )]
    pub srec: Account<'info, Srec>,

    #[account(
        mut,
        seeds = [b"marketplace"],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut)]
    pub buyer_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub seller_usdc: Account<'info, TokenAccount>,

    #[account(mut)]
    pub treasury_usdc: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ─────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────

#[account]
pub struct Marketplace {
    pub authority:         Pubkey,  // 32
    pub fee_basis_points:  u16,     // 2
    pub total_minted:      u64,     // 8
    pub total_traded:      u64,     // 8
    pub bump:              u8,      // 1
}

impl Marketplace {
    pub const SIZE: usize = 8 + 32 + 2 + 8 + 8 + 1 + 32; // discriminator + fields + padding
}

#[account]
pub struct Srec {
    pub serial_number: u64,    // 8  — unique incrementing ID
    pub system_id:     String, // 4 + 64
    pub owner:         Pubkey, // 32
    pub buyer:         Pubkey, // 32
    pub state:         String, // 4 + 4
    pub vintage_year:  u16,    // 2
    pub mwh_generated: u64,    // 8  — stored as integer MWh × 1000 (3 decimal places)
    pub list_price:    u64,    // 8  — micro-USDC
    pub status:        SrecStatus, // 1
    pub created_at:    i64,    // 8
    pub listed_at:     i64,    // 8
    pub sold_at:       i64,    // 8
    pub bump:          u8,     // 1
}

impl Srec {
    pub const SIZE: usize = 8 + 8 + (4+64) + 32 + 32 + (4+4) + 2 + 8 + 8 + 1 + 8 + 8 + 8 + 1 + 32;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum SrecStatus {
    Minted,
    Listed,
    Retired,
}

// ─────────────────────────────────────────────────────────────
// PARAMETERS
// ─────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MintSrecParams {
    pub system_id:     String,
    pub state:         String,
    pub vintage_year:  u16,
    pub mwh_generated: u64,
    pub serial_number: u64,
}

// ─────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────

#[event]
pub struct MarketplaceInitialized {
    pub authority:         Pubkey,
    pub fee_basis_points:  u16,
}

#[event]
pub struct SrecMinted {
    pub serial_number: u64,
    pub system_id:     String,
    pub owner:         Pubkey,
    pub state:         String,
    pub vintage_year:  u16,
    pub mwh_generated: u64,
    pub timestamp:     i64,
}

#[event]
pub struct SrecListed {
    pub serial_number:    u64,
    pub owner:            Pubkey,
    pub price_usdc_micro: u64,
    pub state:            String,
}

#[event]
pub struct SrecRetired {
    pub serial_number:    u64,
    pub system_id:        String,
    pub seller:           Pubkey,
    pub buyer:            Pubkey,
    pub state:            String,
    pub vintage_year:     u16,
    pub price_usdc_micro: u64,
    pub fee_usdc_micro:   u64,
    pub retired_at:       i64,
}

// ─────────────────────────────────────────────────────────────
// ERRORS
// ─────────────────────────────────────────────────────────────

#[error_code]
pub enum HeliosError {
    #[msg("Production value must be greater than zero")]
    InvalidProduction,
    #[msg("State code must be 2-4 characters")]
    InvalidState,
    #[msg("Price must be greater than zero")]
    InvalidPrice,
    #[msg("Only the certificate owner can perform this action")]
    Unauthorized,
    #[msg("Certificate is already listed for sale")]
    AlreadyListed,
    #[msg("Certificate is not listed for sale")]
    NotListed,
    #[msg("Cannot purchase your own certificate")]
    CannotBuyOwnSrec,
}
