import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Switch } from '@/components/ui/switch.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { TrendingUp, TrendingDown, Settings, Home, BarChart3, Bell, Star, ExternalLink, Loader2 } from 'lucide-react'
import './App.css'

const API_BASE_URL = '/api'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(true)
  const [binanceEnabled, setBinanceEnabled] = useState(true)
  const [mexcEnabled, setMexcEnabled] = useState(true)
  const [cryptoData, setCryptoData] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch market overview data
  const fetchMarketData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/crypto/market-overview`)
      const data = await response.json()
      
      if (data.success) {
        setCryptoData(data.data.slice(0, 4)) // Show top 4 coins
      } else {
        setError('فشل في تحميل بيانات السوق')
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم')
      console.error('Error fetching market data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch recommendations
  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/crypto/recommendations`)
      const data = await response.json()
      
      if (data.success) {
        setRecommendations(data.data)
      } else {
        setError('فشل في تحميل التوصيات')
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم')
      console.error('Error fetching recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketData()
    fetchRecommendations()
    
    // Refresh data every 5 minutes
    const interval = setInterval(() => {
      fetchMarketData()
      fetchRecommendations()
    }, 300000)
    
    return () => clearInterval(interval)
  }, [])

  const getStrengthColor = (strength) => {
    if (strength >= 80) return 'text-green-500'
    if (strength >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getStrengthLabel = (strength) => {
    if (strength >= 80) return 'قوية'
    if (strength >= 60) return 'متوسطة'
    return 'ضعيفة'
  }

  const formatPrice = (price) => {
    if (price >= 1) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else {
      return `$${price.toFixed(6)}`
    }
  }

  if (error) {
    return (
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="bg-background text-foreground flex items-center justify-center min-h-screen">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => {
                setError(null)
                fetchMarketData()
                fetchRecommendations()
              }}>
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">توصيات العملات الرقمية</h1>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? '☀️' : '🌙'}
              </Button>
              <Bell className="h-5 w-5" />
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                الرئيسية
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                التوصيات
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                الإعدادات
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cryptoData.map((crypto) => (
                  <Card key={crypto.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                            {crypto.symbol.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{crypto.name}</p>
                            <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold">{formatPrice(crypto.price)}</p>
                        <div className={`flex items-center gap-1 ${crypto.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {crypto.change_24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          <span className="text-sm font-medium">
                            {crypto.change_24h >= 0 ? '+' : ''}{crypto.change_24h?.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>أهم التوصيات اليوم</CardTitle>
                  <CardDescription>العملات المتوقع ارتفاع قيمتها</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendations.slice(0, 3).map((rec) => (
                      <div key={rec.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                            {rec.symbol.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{rec.name}</p>
                            <p className="text-sm text-muted-foreground">{rec.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStrengthColor(rec.strength)}>
                            {getStrengthLabel(rec.strength)} {rec.strength}%
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">{rec.exchange}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">التوصيات الحالية</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={binanceEnabled} onCheckedChange={setBinanceEnabled} />
                    <span className="text-sm">Binance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={mexcEnabled} onCheckedChange={setMexcEnabled} />
                    <span className="text-sm">MEXC</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchRecommendations}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تحديث'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recommendations
                  .filter(rec => 
                    (binanceEnabled && rec.exchange === 'Binance') || 
                    (mexcEnabled && rec.exchange === 'MEXC')
                  )
                  .map((rec) => (
                  <Card key={rec.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                            {rec.symbol.charAt(0)}
                          </div>
                          <div>
                            <CardTitle>{rec.name}</CardTitle>
                            <CardDescription>{rec.symbol}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline">{rec.exchange}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">قوة التوصية</p>
                          <div className="flex items-center gap-2">
                            <Progress value={rec.strength} className="flex-1" />
                            <span className={`text-sm font-medium ${getStrengthColor(rec.strength)}`}>
                              {rec.strength}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الإطار الزمني</p>
                          <p className="font-medium">{rec.time_frame}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">السعر الحالي</p>
                          <p className="font-bold text-lg">{formatPrice(rec.current_price)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الهدف المتوقع</p>
                          <p className="font-bold text-lg text-green-500">{formatPrice(rec.target_price)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground">العائد المتوقع</p>
                        <p className="font-bold text-green-500">+{rec.potential_return}%</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">أسباب التوصية</p>
                        <ul className="space-y-1">
                          {rec.reasons.map((reason, index) => (
                            <li key={index} className="text-sm flex items-start gap-2">
                              <Star className="h-3 w-3 mt-1 text-yellow-500 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1" size="sm">
                          إضافة للمراقبة
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          عرض في {rec.exchange}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {recommendations.filter(rec => 
                (binanceEnabled && rec.exchange === 'Binance') || 
                (mexcEnabled && rec.exchange === 'MEXC')
              ).length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">لا توجد توصيات متاحة حالياً</p>
                    <Button 
                      className="mt-4" 
                      onClick={fetchRecommendations}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      تحديث التوصيات
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>تفضيلات التبادل</CardTitle>
                  <CardDescription>اختر المنصات التي تريد رؤية التوصيات منها</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Binance</p>
                      <p className="text-sm text-muted-foreground">أكبر منصة تداول عملات رقمية في العالم</p>
                    </div>
                    <Switch checked={binanceEnabled} onCheckedChange={setBinanceEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">MEXC</p>
                      <p className="text-sm text-muted-foreground">منصة تداول متقدمة مع عملات متنوعة</p>
                    </div>
                    <Switch checked={mexcEnabled} onCheckedChange={setMexcEnabled} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الإشعارات</CardTitle>
                  <CardDescription>تخصيص التنبيهات والإشعارات</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">الإشعارات الفورية</p>
                      <p className="text-sm text-muted-foreground">تلقي إشعارات عند ظهور توصيات جديدة</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">تنبيهات الأسعار</p>
                      <p className="text-sm text-muted-foreground">تنبيهات عند تحقيق الأهداف أو وقف الخسارة</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>خيارات العرض</CardTitle>
                  <CardDescription>تخصيص مظهر التطبيق</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">الوضع الداكن</p>
                      <p className="text-sm text-muted-foreground">تفعيل المظهر الداكن للتطبيق</p>
                    </div>
                    <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>معلومات التطبيق</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm"><strong>الإصدار:</strong> 1.0.0</p>
                  <p className="text-sm"><strong>آخر تحديث:</strong> {new Date().toLocaleDateString('ar-SA')}</p>
                  <p className="text-sm text-muted-foreground">
                    تطبيق توصيات العملات الرقمية يوفر تحليلات فنية متقدمة وتوصيات استثمارية لمنصتي Binance و MEXC
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

export default App

