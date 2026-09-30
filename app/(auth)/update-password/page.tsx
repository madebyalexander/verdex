import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'

export default function UpdatePasswordPage() {
  return (
    <Card className="w-full max-w-sm gap-6 py-7 shadow-2xl shadow-black/40">
      <CardHeader>
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <UpdatePasswordForm />
      </CardContent>
    </Card>
  )
}
