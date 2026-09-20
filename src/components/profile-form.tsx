'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/utils/api-client'

export function ProfileForm() {
  const { data: session } = useSession()
  const [form, setForm] = useState({ name: '', organization: '', bio: '', phone: '' })
  const [avatar, setAvatar] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [allowSearch, setAllowSearch] = useState(true)
  useEffect(() => {
    if (!session?.user.id) return
    apiClient.get(`/api/attendees/${session.user.id}`).then(async response => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      const profile = result.data
      setForm({ name: profile.name || '', organization: profile.organization || '', bio: profile.bio || '', phone: profile.phone || '' })
      setAvatar(profile.avatarUrl)
      setAllowSearch(profile.privacy?.allowSearch !== false)
      setLoaded(true)
    }).catch(error => setMessage(error.message))
  }, [session?.user.id])
  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!session?.user.id) return
    setBusy(true)
    try {
      const response = await apiClient.put(`/api/attendees/${session.user.id}`, form)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      const privacy = await apiClient.put(`/api/attendees/${session.user.id}/privacy`, { allowSearch, showEmail: false, showPhone: false, showOrganization: true, showBio: true, showInterests: true })
      if (!privacy.ok) throw new Error('Profile saved, but privacy settings could not be saved')
      setMessage('Profile saved')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save profile') }
    finally { setBusy(false) }
  }
  async function upload(file?: File) {
    if (!file || !session?.user.id) return
    setBusy(true)
    try {
      const body = new FormData(); body.append('avatar', file)
      const response = await apiClient.fetch(`/api/attendees/${session.user.id}/avatar`, { method: 'POST', body })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setAvatar(result.data.avatarUrl); setMessage('Avatar saved')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload failed') }
    finally { setBusy(false) }
  }
  return <form onSubmit={save} className="max-w-xl space-y-5 rounded-lg border bg-white p-6">
    {message && <p role="status">{message}</p>}
    {avatar && <img src={avatar} alt="Your avatar" width={96} height={96} className="rounded-full" />}
    <label className="block">Profile photo (JPEG, PNG or WebP, up to 2MB)<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || !loaded} onChange={event => upload(event.target.files?.[0])} className="mt-2 block" /></label>
    {(['name', 'organization', 'phone', 'bio'] as const).map(field => <label key={field} className="block capitalize">{field}<input required={field === 'name'} value={form[field]} maxLength={field === 'bio' ? 500 : field === 'phone' ? 20 : 100} onChange={event => setForm({ ...form, [field]: event.target.value })} className="mt-1 block w-full rounded border p-2" /></label>)}
    <label className="flex gap-2"><input type="checkbox" checked={allowSearch} onChange={event => setAllowSearch(event.target.checked)} />Allow my profile to appear in search</label>
    <p className="text-sm text-gray-600">Email and phone remain private. Use fictional information in this portfolio demo.</p>
    <button disabled={busy || !loaded} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save profile'}</button>
  </form>
}
