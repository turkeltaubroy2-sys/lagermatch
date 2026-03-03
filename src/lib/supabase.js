import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
        params: { eventsPerSecond: 10 },
    },
});

// ─── Helper to map DB rows to app format ────────────────────────
const mapProfile = (row) => row ? {
    ...row,
    created_date: row.created_at,
    photo_urls: row.photo_urls || [],
} : null;

const mapMatch = (row) => row ? { ...row, created_date: row.created_at } : null;
const mapDrink = (row) => row ? { ...row, created_date: row.created_at } : null;
const mapMessage = (row) => row ? { ...row, created_date: row.created_at } : null;

// ─── Entity helpers ─────────────────────────────────────────────
export const db = {

    Profile: {
        async filter(filters = {}) {
            let q = supabase.from('profiles').select('*');
            if (filters.device_id) q = q.eq('device_id', filters.device_id);
            if (filters.id) q = q.eq('id', filters.id);
            if (filters.is_blocked !== undefined) q = q.eq('is_blocked', filters.is_blocked);
            const { data, error } = await q.order('created_at', { ascending: false });
            if (error) { console.error('Profile.filter error:', error); return []; }
            return (data || []).map(mapProfile);
        },
        async create(payload) {
            const { data, error } = await supabase.from('profiles').insert([payload]).select().single();
            if (error) throw error;
            return mapProfile(data);
        },
        async update(id, payload) {
            const { data, error } = await supabase.from('profiles').update(payload).eq('id', id).select().single();
            if (error) throw error;
            return mapProfile(data);
        },
        async delete(id) {
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) throw error;
            return {};
        },
        subscribe(callback) {
            const channel = supabase.channel('profiles-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
                    callback({ type: payload.eventType, data: mapProfile(payload.new || payload.old) });
                }).subscribe();
            return () => supabase.removeChannel(channel);
        },
    },

    Match: {
        async filter(filters = {}) {
            let q = supabase.from('matches').select('*');
            if (filters.id) q = q.eq('id', filters.id);
            if (filters.user1_id) q = q.eq('user1_id', filters.user1_id);
            if (filters.user2_id) q = q.eq('user2_id', filters.user2_id);
            const { data, error } = await q.order('created_at', { ascending: false });
            if (error) { console.error('Match.filter error:', error); return []; }
            return (data || []).map(mapMatch);
        },
        async create(payload) {
            const { data, error } = await supabase.from('matches').insert([payload]).select().single();
            if (error) throw error;
            return mapMatch(data);
        },
        async delete(id) {
            const { error } = await supabase.from('matches').delete().eq('id', id);
            if (error) throw error;
            return {};
        },
        subscribe(callback) {
            const channel = supabase.channel('matches-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
                    callback({ type: payload.eventType, data: mapMatch(payload.new || payload.old) });
                }).subscribe();
            return () => supabase.removeChannel(channel);
        },
    },

    Drink: {
        async filter(filters = {}) {
            let q = supabase.from('drinks').select('*');
            if (filters.id) q = q.eq('id', filters.id);
            if (filters.sender_id) q = q.eq('sender_id', filters.sender_id);
            if (filters.receiver_id) q = q.eq('receiver_id', filters.receiver_id);
            if (filters.status) q = q.eq('status', filters.status);
            const { data, error } = await q.order('created_at', { ascending: false });
            if (error) { console.error('Drink.filter error:', error); return []; }
            return (data || []).map(mapDrink);
        },
        async create(payload) {
            const { data, error } = await supabase.from('drinks').insert([payload]).select().single();
            if (error) throw error;
            return mapDrink(data);
        },
        async update(id, payload) {
            const { data, error } = await supabase.from('drinks').update(payload).eq('id', id).select().single();
            if (error) throw error;
            return mapDrink(data);
        },
        async delete(id) {
            const { error } = await supabase.from('drinks').delete().eq('id', id);
            if (error) throw error;
            return {};
        },
        subscribe(callback) {
            const channel = supabase.channel(`drinks-realtime-${Math.random()}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'drinks' }, (payload) => {
                    callback({ type: 'create', data: mapDrink(payload.new || payload.old) });
                }).subscribe();
            return () => supabase.removeChannel(channel);
        },
    },

    Message: {
        async filter(filters = {}) {
            let q = supabase.from('messages').select('*');
            if (filters.id) q = q.eq('id', filters.id);
            if (filters.sender_id) q = q.eq('sender_id', filters.sender_id);
            if (filters.receiver_id) q = q.eq('receiver_id', filters.receiver_id);
            const { data, error } = await q.order('created_at', { ascending: true });
            if (error) { console.error('Message.filter error:', error); return []; }
            return (data || []).map(mapMessage);
        },
        async create(payload) {
            const { data, error } = await supabase.from('messages').insert([payload]).select().single();
            if (error) throw error;
            return mapMessage(data);
        },
        async delete(id) {
            const { error } = await supabase.from('messages').delete().eq('id', id);
            if (error) throw error;
            return {};
        },
        subscribe(callback) {
            const channel = supabase.channel(`messages-realtime-${Math.random()}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                    callback({ type: 'create', data: mapMessage(payload.new) });
                }).subscribe();
            return () => supabase.removeChannel(channel);
        },
    },

    Swipe: {
        async filter(filters = {}) {
            let q = supabase.from('swipes').select('*');
            const { data, error } = await q;
            if (error) { console.error('Swipe.filter error:', error); return []; }
            return data || [];
        },
        async create(payload) {
            const { data, error } = await supabase.from('swipes').insert([payload]).select().single();
            if (error) throw error;
            return data;
        },
        async delete(id) {
            const { error } = await supabase.from('swipes').delete().eq('id', id);
            if (error) throw error;
            return {};
        },
    },
};

// ─── File Upload via Supabase Storage ───────────────────────────
export async function uploadFile(file) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('photos').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
    });
    if (error) throw error;
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return data.publicUrl;
}
