import type { Metadata } from "next";
import { getMyProfile, requireCustomer } from "@/lib/account";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Edit Profile", robots: { index: false } };

export default async function EditProfilePage() {
  const user = await requireCustomer("/account/edit");
  const profile = await getMyProfile(user.id);

  return (
    <div>
      <h2 className="text-xl font-extrabold text-navy-950">Edit profile</h2>
      <p className="mt-1 text-[14px] text-ink-muted">
        Your email ({user.email}) is your login and can&rsquo;t be changed here.
      </p>
      <ProfileForm profile={profile} />
    </div>
  );
}
