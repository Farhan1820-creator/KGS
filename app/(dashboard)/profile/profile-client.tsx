"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  KeyRound,
  Loader2,
  Save,
  Camera,
  School,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PhotoUploadSquare } from "@/components/layout/photo-upload-square";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { deleteCloudinaryImage } from "@/lib/cloudinary-server";
import { updateProfile } from "./profile-actions";

export interface ProfileUserData {
  id: number;
  name: string;
  email: string;
  contactNumber: string | null;
  role: "admin" | "teacher" | "student" | "staff";
  photoUrl: string | null;
  createdAt: Date;
  studentInfo?: {
    rollNumber: string | null;
    className: string | null;
    section: string | null;
    admissionDate: string | null;
    schoolName: string | null;
  } | null;
  teacherInfo?: {
    teacherId: string | null;
    joinDate: string | null;
    subjects: string[];
  } | null;
}

interface ProfileClientProps {
  user: ProfileUserData;
}

export function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();

  const [name, setName] = useState(user.name);
  const [photoUrl, setPhotoUrl] = useState<string | null>(user.photoUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handlePhotoSelected(file: File) {
    setUploadingPhoto(true);
    setUploadProgress(0);
    try {
      const result = await uploadImageToCloudinary(file, { onProgress: setUploadProgress });
      setPhotoUrl(result.url);
      toast.success("Profile photo uploaded. Click 'Save Changes' to update profile.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handlePhotoRemove() {
    if (!photoUrl) return;
    setRemovingPhoto(true);
    try {
      await deleteCloudinaryImage(photoUrl);
      setPhotoUrl(null);
      toast.success("Profile photo removed. Click 'Save Changes' to apply.");
    } catch {
      toast.error("Could not remove photo.");
    } finally {
      setRemovingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Full name is required.");
      return;
    }

    if (password && password.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateProfile({
        name: name.trim(),
        photoUrl: photoUrl || null,
        password: password || undefined,
      });

      if (!res.success) {
        toast.error(res.error || "Failed to update profile.");
        return;
      }

      toast.success("Profile updated successfully!");
      setPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch {
      toast.error("Something went wrong while saving profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="page-shell space-y-6">
      {/* Top Profile Hero Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-r from-primary/10 via-card to-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={user.name}
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-2 border-primary/30 shadow-md"
              />
            ) : (
              <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-2xl sm:text-3xl shadow-md">
                {initials}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{user.name}</h1>
              <Badge className="capitalize font-bold text-xs px-2.5 py-0.5">
                {user.role}
              </Badge>
              {user.studentInfo?.rollNumber && (
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs font-semibold">
                  {user.studentInfo.rollNumber}
                </Badge>
              )}
              {user.teacherInfo?.teacherId && (
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs font-semibold">
                  {user.teacherInfo.teacherId}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </p>

            {user.studentInfo && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>
                  Class: <strong className="text-foreground">{user.studentInfo.className || "—"}</strong>
                  {user.studentInfo.section ? ` (${user.studentInfo.section})` : ""}
                </span>
                {user.studentInfo.schoolName && (
                  <span className="ml-2">
                    • School: <strong className="text-foreground">{user.studentInfo.schoolName}</strong>
                  </span>
                )}
              </p>
            )}

            {user.teacherInfo && user.teacherInfo.subjects.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-primary" /> Subjects:
                </span>
                {user.teacherInfo.subjects.map((sub) => (
                  <Badge key={sub} variant="secondary" className="text-[11px] font-normal py-0 px-2">
                    {sub}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Photo Upload Card */}
          <Card className="lg:col-span-1 shadow-2xs border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                Profile Photo
              </CardTitle>
              <CardDescription className="text-xs">
                Upload or edit your avatar image.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-2 pb-6">
              <PhotoUploadSquare
                photoUrl={photoUrl}
                name={name}
                editable={true}
                uploading={uploadingPhoto}
                progress={uploadProgress}
                onFileSelected={handlePhotoSelected}
                onRemove={photoUrl ? handlePhotoRemove : undefined}
                removing={removingPhoto}
                size={140}
              />
              <p className="text-[11px] text-muted-foreground text-center mt-3 max-w-[200px]">
                Click above to choose an image from your device (Max 8MB).
              </p>
            </CardContent>
          </Card>

          {/* Right Column: Profile & Security Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details */}
            <Card className="shadow-2xs border-border/70">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Account Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Update your contact details and basic information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="pl-9 h-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={user.email}
                        disabled
                        className="pl-9 h-9 text-sm bg-muted/50 cursor-not-allowed opacity-90"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Email is managed by academy administration.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold">Contact / WhatsApp Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={user.contactNumber || "Not provided"}
                        disabled
                        className="pl-9 h-9 text-sm bg-muted/50 cursor-not-allowed opacity-90"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Phone number is managed by academy administration.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Account Role & Access</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-primary" />
                      <div className="h-9 flex items-center pl-9 pr-3 rounded-md border bg-muted/30 text-xs font-semibold uppercase text-primary">
                        {user.role} Portal Access
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic / Role Metadata */}
            {(user.studentInfo || user.teacherInfo) && (
              <Card className="shadow-2xs border-border/70">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <School className="h-4 w-4 text-primary" />
                    Academic Records
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Official academy registration and enrollment details.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {user.studentInfo && (
                      <>
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                          <span className="text-muted-foreground block text-[11px]">Assigned Class</span>
                          <span className="font-bold text-sm text-foreground">
                            {user.studentInfo.className || "Not Assigned"}
                            {user.studentInfo.section ? ` - Sec ${user.studentInfo.section}` : ""}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                          <span className="text-muted-foreground block text-[11px]">Student Roll No</span>
                          <span className="font-bold text-sm text-foreground font-mono">
                            {user.studentInfo.rollNumber || "—"}
                          </span>
                        </div>
                        {user.studentInfo.admissionDate && (
                          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                            <span className="text-muted-foreground block text-[11px]">Admission Date</span>
                            <span className="font-semibold text-foreground">
                              {user.studentInfo.admissionDate}
                            </span>
                          </div>
                        )}
                        {user.studentInfo.schoolName && (
                          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                            <span className="text-muted-foreground block text-[11px]">School / Institute</span>
                            <span className="font-semibold text-foreground">
                              {user.studentInfo.schoolName}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {user.teacherInfo && (
                      <>
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                          <span className="text-muted-foreground block text-[11px]">Teacher ID</span>
                          <span className="font-bold text-sm text-foreground font-mono">
                            {user.teacherInfo.teacherId || "—"}
                          </span>
                        </div>
                        {user.teacherInfo.joinDate && (
                          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                            <span className="text-muted-foreground block text-[11px]">Joining Date</span>
                            <span className="font-semibold text-foreground">
                              {user.teacherInfo.joinDate}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Change Password Card */}
            <Card className="shadow-2xs border-border/70">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Security & Password
                </CardTitle>
                <CardDescription className="text-xs">
                  Leave blank if you do not want to change your password.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-xs font-semibold">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 text-sm"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password" className="text-xs font-semibold">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-9 text-sm"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSaving || uploadingPhoto || removingPhoto}
                className="gap-2 font-bold px-6 h-10 shadow-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
