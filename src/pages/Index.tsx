import { Navbar } from "@/components/Navbar"
import { Hero7 } from "@/components/Hero7"
import { Features } from "@/components/Features"
import { DetailedFeatures } from "@/components/DetailedFeatures"
import { HowItWorks } from "@/components/HowItWorks"
import { Pricing } from "@/components/Pricing"
import { Advantages } from "@/components/Advantages"
import { CapabilitiesShowcase } from "@/components/CapabilitiesShowcase"

const Index = () => {
  return (
    <div className="min-h-screen w-full relative">
      {/* Radial Gradient Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #6366f1 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <main className="lg:mx-12">
          <Hero7
            heading="Инфраструктура, BIM и САПР — в одной среде"
            description="24 профессиональных модуля: дороги и сети, геодезия и ЦМР, BIM-моделирование, 3D-сборки в стиле КОМПАС и полный набор функций AutoCAD, Civil 3D, КОМПАС-3D и SOLIDWORKS. Без подписки и ограничений."
            button={{ text: "Попробовать бесплатно", url: "/login" }}
          />
          <Features />
          <CapabilitiesShowcase />
          <HowItWorks />
          <DetailedFeatures />
          <Pricing />
        </main>
      </div>
    </div>
  )
}

export default Index