"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySubscription = verifySubscription;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_KEY || '');
async function verifySubscription(userId) {
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
    }
    catch (err) {
        console.error('Handshake Exception:', err);
        return false;
    }
}
