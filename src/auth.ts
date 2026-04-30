import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_KEY || ''
);

export async function verifySubscription(userId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('status, plan_id')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            console.error('Supabase Auth Error:', error?.message);
            return false;
        }
        
        // Final logic check: status must be 'active' for hardware access
        return data.status === 'active';
    } catch (err) {
        console.error('Handshake Exception:', err);
        return false;
    }
}
