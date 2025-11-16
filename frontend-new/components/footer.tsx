"use client"

import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-foreground/60 hover:text-foreground transition-colors text-sm">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="text-foreground/60 hover:text-foreground transition-colors text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-foreground/60 hover:text-foreground transition-colors text-sm">
                  API
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-foreground/60 hover:text-foreground transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-foreground/60 hover:text-foreground transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-foreground/60 hover:text-foreground transition-colors text-sm">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-foreground/60 hover:text-foreground transition-colors text-sm">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-foreground/60 hover:text-foreground transition-colors text-sm">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="text-foreground/60 hover:text-foreground transition-colors text-sm">
                  Compliance
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-foreground/60 hover:text-foreground transition-colors text-sm">
                  Docs
                </Link>
              </li>
              <li>
                <Link href="#" className="text-foreground/60 hover:text-foreground transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-foreground/60 hover:text-foreground transition-colors text-sm">
                  Status
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-8">
          <p className="text-center text-foreground/50 text-sm">© 2025 CuraAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
