import MermaPublicClient from './MermaPublicClient'

export const metadata = {
  title: 'Reporte de Merma - Zona B | Retail Ops',
  description: 'Reporte ejecutivo y consolidado de merma para las tiendas de Zona B',
}

export const revalidate = 0

export default function MermaZonaBPage() {
  return <MermaPublicClient />
}
