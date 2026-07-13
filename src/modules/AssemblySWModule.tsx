import AssemblyModule from "./AssemblyModule"

// Среда сборки в стиле SolidWorks (светлая тема, синий #0078d4).
// Переиспользует всю логику AssemblyModule через вариант оформления "sw".
export default function AssemblySWModule() {
  return <AssemblyModule variant="sw" />
}
