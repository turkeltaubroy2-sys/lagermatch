// Real base44Client — all calls backed by Supabase
import { db, uploadFile } from '@/lib/supabase';

export const base44 = {
  auth: {
    me: async () => ({ id: 'local', name: 'Local' }),
    logout: () => { },
    redirectToLogin: () => { },
    isAuthenticated: async () => false,
  },
  entities: {
    Profile: db.Profile,
    Match: db.Match,
    Drink: db.Drink,
    Message: db.Message,
    Swipe: db.Swipe,
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const url = await uploadFile(file);
        return { file_url: url };
      },
    },
  },
  appLogs: {
    logUserInApp: async () => { },
  },
};
