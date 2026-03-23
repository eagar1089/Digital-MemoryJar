import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-4">
        <Card className="glass border-primary/20 p-6 space-y-3 text-center">
          <h1 className="text-2xl font-bold">You are offline</h1>
          <p className="text-sm text-muted-foreground">
            Internet connection is unavailable right now. Reconnect and try again.
          </p>
          <Link href="/home" className="inline-block">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Try Again</Button>
          </Link>
        </Card>
      </div>
    </main>
  )
}
