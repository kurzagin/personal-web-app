import { connection } from 'next/server';
import { getProfile } from '@/lib/db';
import ProfileClient from './ProfileClient';

export async function generateMetadata() {
  const profile = await getProfile();
  return {
    title: `${profile.name} — profile — kurzagin`,
  };
}

export default async function ProfilePage() {
  await connection();
  const profile = await getProfile();

  return (
    <ProfileClient
      profile={JSON.parse(JSON.stringify(profile))}
    />
  );
}
