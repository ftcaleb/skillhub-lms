import { redirect } from 'next/navigation'

// Root "/" is a pure redirect — the real app lives at /dashboard (protected)
export default function Home() {
  redirect('/dashboard')
}
