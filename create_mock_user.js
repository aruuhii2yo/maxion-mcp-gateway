const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function createMockUser() {
    console.log('--- Maxion Mock User Creation ---');
    const mockUserId = 'mock-user-123';
    
    const { data, error } = await supabase
        .from('subscriptions')
        .upsert({ 
            user_id: mockUserId, 
            status: 'active', 
            plan_id: 'maxion_v16_core',
            updated_at: new Date()
        }, { onConflict: 'user_id' })
        .select();

    if (error) {
        console.error('[FAIL] Could not create mock user:', error.message);
    } else {
        console.log(`[SUCCESS] Mock User Created: ${mockUserId}`);
        console.log('Status: ACTIVE');
        console.log('You can now use this ID in Claude to bypass the paywall.');
    }
}

createMockUser();
