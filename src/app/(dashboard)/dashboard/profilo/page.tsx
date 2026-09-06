import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { UserService } from '@/server/services/user.service';
import { ProfileView } from '@/components/views/dashboard/profile/profile-view';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  let userProfile = null;

  try {
    userProfile = await UserService.getUserProfile(authUser.id);
  } catch (e) {
    console.warn('Profilo utente non trovato o non attivo:', e);
  }

  return (
    <ProfileView 
      authUser={{
        id: authUser.id,
        email: authUser.email,
      }} 
      userProfile={userProfile} 
    />
  );
}