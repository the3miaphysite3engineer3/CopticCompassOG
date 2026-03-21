/* eslint-disable @next/next/no-img-element */
'use client'

import { useState } from 'react'
import imageCompression from 'browser-image-compression'
import { updateProfile } from '@/actions/profile'
import { createClient } from '@/lib/supabase/client'
import { FormField } from '@/components/FormField'
import { StatusNotice } from '@/components/StatusNotice'
import { SurfacePanel } from '@/components/SurfacePanel'
import type { Tables } from '@/types/supabase'

export function ProfileForm({ profile }: { profile: Tables<'profiles'> }) {
  const [isUploading, setIsUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url)
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const supabase = createClient()

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setStatus(null)
      setIsUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      if (!supabase) {
        throw new Error('Database connection disabled. Cannot upload file.')
      }

      const file = event.target.files[0]

      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      }
      
      setStatus({ message: 'Compressing image...', type: 'success' })
      const compressedFile = await imageCompression(file, options)
      setStatus({ message: 'Uploading to server...', type: 'success' })

      const fileExt = file.name.split('.').pop() || 'jpeg'
      const filePath = `${profile.id}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
      
      // Auto-clear the "Uploading to server..." success message
      setTimeout(() => setStatus(null), 3000)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error occurred'
      setStatus({ message: errorMessage, type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSubmit(formData: FormData) {
    setStatus(null)
    if (avatarUrl) {
      formData.append('avatar_url', avatarUrl)
    }
    
    const result = await updateProfile(formData)
    if (result.success) {
      setStatus({ message: 'Profile updated successfully!', type: 'success' })
      setTimeout(() => setStatus(null), 3000)
    } else {
      setStatus({ message: result.error || 'Failed to update profile.', type: 'error' })
    }
  }

  return (
    <SurfacePanel rounded="3xl" className="p-6 md:p-8">
      <h3 className="text-xl font-semibold mb-6 text-stone-800 dark:text-stone-200">Profile Settings</h3>
      
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-stone-100 dark:bg-stone-800 border-4 border-white dark:border-stone-700 shadow-sm flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-stone-400 dark:text-stone-500 text-sm">No Avatar</span>
            )}
          </div>
          <div>
            <label className="btn-secondary text-xs px-4 py-2 cursor-pointer relative" htmlFor="single">
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </label>
            <input
              style={{
                visibility: 'hidden',
                position: 'absolute',
              }}
              type="file"
              id="single"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={isUploading}
            />
          </div>
        </div>

        <form action={handleSubmit} className="space-y-6 flex-1 w-full text-stone-800 dark:text-stone-200">
          <FormField htmlFor="full_name" label="Full Name">
            <input
              id="full_name"
              name="full_name"
              type="text"
              className="input-base"
              defaultValue={profile.full_name || ''}
              placeholder="Your Name"
            />
          </FormField>

          <FormField htmlFor="email" label="Email Address">
            <input
              id="email"
              type="email"
              className="input-base bg-stone-50 dark:bg-stone-900 text-stone-500"
              defaultValue={profile.email || ''}
              disabled
            />
            <p className="text-xs text-stone-500 mt-1">Email cannot be changed currently.</p>
          </FormField>

          <button type="submit" className="btn-primary w-full md:w-auto px-8" disabled={isUploading}>
            Save Changes
          </button>

          {status && (
            <StatusNotice tone={status.type} className="mt-4">
              {status.message}
            </StatusNotice>
          )}
        </form>
      </div>
    </SurfacePanel>
  )
}
