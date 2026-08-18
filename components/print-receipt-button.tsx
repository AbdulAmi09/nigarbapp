"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export default function PrintReceiptButton() {
  return (
    <Button variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
      <Printer className="w-4 h-4 mr-2" />
      Print / Save as PDF
    </Button>
  )
}
