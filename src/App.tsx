import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import Home from '@/pages/Home'

function App() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <Home />
      <Footer />
    </div>
  )
}

export default App
