import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export function Navbar() {
  const navigate = useNavigate()
  return (
    <nav className="relative z-10 w-full px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
          <div className="text-2xl font-bold font-heading text-gray-900">CivilPro</div>
        </div>

        {/* CTA Button */}
        <Button size="lg" className="hover:bg-indigo-700 text-white bg-slate-900" onClick={() => navigate("/login")}>
          Войти
        </Button>
      </div>
    </nav>
  )
}