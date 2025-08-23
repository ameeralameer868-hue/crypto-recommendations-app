from flask import Blueprint, jsonify, request
import requests
import json
from datetime import datetime, timedelta
import time
import os

crypto_bp = Blueprint('crypto', __name__)

# استخدام البيانات التجريبية بسبب قيود API
DEMO_DATA_PATH = "/home/ubuntu/crypto-recommendations-app/demo-data.json"

def load_demo_data():
    """تحميل البيانات التجريبية من الملف"""
    try:
        if os.path.exists(DEMO_DATA_PATH):
            with open(DEMO_DATA_PATH, 'r') as f:
                return json.load(f)
        return None
    except Exception as e:
        print(f"Error loading demo data: {e}")
        return None

# CoinGecko API base URL (free tier)
COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3"

# Binance API base URL
BINANCE_BASE_URL = "https://api.binance.com/api/v3"

# MEXC API base URL  
MEXC_BASE_URL = "https://api.mexc.com/api/v3"

def get_coingecko_data(endpoint, params=None):
    """Get data from CoinGecko API with error handling"""
    try:
        url = f"{COINGECKO_BASE_URL}/{endpoint}"
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching from CoinGecko: {e}")
        return None

def get_binance_data(endpoint, params=None):
    """Get data from Binance API with error handling"""
    try:
        url = f"{BINANCE_BASE_URL}/{endpoint}"
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching from Binance: {e}")
        return None

def get_mexc_data(endpoint, params=None):
    """Get data from MEXC API with error handling"""
    try:
        url = f"{MEXC_BASE_URL}/{endpoint}"
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching from MEXC: {e}")
        return None

def calculate_technical_indicators(prices):
    """Calculate basic technical indicators"""
    if len(prices) < 20:
        return {}
    
    # Simple Moving Average (20 periods)
    sma_20 = sum(prices[-20:]) / 20
    
    # RSI calculation (simplified)
    gains = []
    losses = []
    for i in range(1, len(prices)):
        change = prices[i] - prices[i-1]
        if change > 0:
            gains.append(change)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(change))
    
    if len(gains) >= 14:
        avg_gain = sum(gains[-14:]) / 14
        avg_loss = sum(losses[-14:]) / 14
        rs = avg_gain / avg_loss if avg_loss != 0 else 0
        rsi = 100 - (100 / (1 + rs))
    else:
        rsi = 50
    
    return {
        'sma_20': sma_20,
        'rsi': rsi,
        'current_price': prices[-1] if prices else 0
    }

def generate_recommendation_score(indicators, volume_change, market_trend):
    """Generate recommendation score based on technical indicators"""
    score = 50  # Base score
    
    # RSI analysis
    if indicators.get('rsi', 50) < 30:  # Oversold
        score += 20
    elif indicators.get('rsi', 50) > 70:  # Overbought
        score -= 15
    elif 40 <= indicators.get('rsi', 50) <= 60:  # Neutral
        score += 5
    
    # Price vs SMA analysis
    current_price = indicators.get('current_price', 0)
    sma_20 = indicators.get('sma_20', 0)
    if current_price > sma_20:
        score += 15
    else:
        score -= 10
    
    # Volume analysis
    if volume_change > 20:  # High volume increase
        score += 15
    elif volume_change > 0:
        score += 5
    else:
        score -= 5
    
    # Market trend
    if market_trend > 0:
        score += 10
    else:
        score -= 5
    
    return max(0, min(100, score))

@crypto_bp.route('/market-overview', methods=['GET'])
def get_market_overview():
    """Get market overview data"""
    try:
        # استخدام البيانات التجريبية
        demo_data = load_demo_data()
        if demo_data and 'market_overview' in demo_data:
            return jsonify(demo_data['market_overview'])
        
        # Get top cryptocurrencies
        coins_data = get_coingecko_data('coins/markets', {
            'vs_currency': 'usd',
            'order': 'market_cap_desc',
            'per_page': 10,
            'page': 1,
            'sparkline': False
        })
        
        if not coins_data:
            return jsonify({'error': 'Failed to fetch market data'}), 500
        
        market_overview = []
        for coin in coins_data:
            market_overview.append({
                'id': coin['id'],
                'name': coin['name'],
                'symbol': coin['symbol'].upper(),
                'price': coin['current_price'],
                'change_24h': coin['price_change_percentage_24h'],
                'market_cap': coin['market_cap'],
                'volume': coin['total_volume'],
                'image': coin['image']
            })
        
        return jsonify({
            'success': True,
            'data': market_overview,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@crypto_bp.route('/recommendations', methods=['GET'])
def get_recommendations():
    """Generate cryptocurrency recommendations"""
    try:
        # استخدام البيانات التجريبية
        demo_data = load_demo_data()
        if demo_data and 'recommendations' in demo_data:
            exchange = request.args.get('exchange', 'all')  # binance, mexc, or all
            
            if exchange != 'all':
                filtered_data = demo_data['recommendations'].copy()
                filtered_data['data'] = [rec for rec in demo_data['recommendations']['data'] 
                                        if rec['exchange'].lower() == exchange.lower()]
                filtered_data['total'] = len(filtered_data['data'])
                return jsonify(filtered_data)
            
            return jsonify(demo_data['recommendations'])
        
        exchange = request.args.get('exchange', 'all')  # binance, mexc, or all
        
        # Get market data for analysis
        coins_data = get_coingecko_data('coins/markets', {
            'vs_currency': 'usd',
            'order': 'market_cap_desc',
            'per_page': 50,
            'page': 1,
            'sparkline': False,
            'price_change_percentage': '1h,24h,7d'
        })
        
        if not coins_data:
            return jsonify({'error': 'Failed to fetch market data'}), 500
        
        recommendations = []
        
        # Analyze each coin
        for coin in coins_data[:20]:  # Analyze top 20 coins
            try:
                # Get historical data for technical analysis
                historical_data = get_coingecko_data(f"coins/{coin['id']}/market_chart", {
                    'vs_currency': 'usd',
                    'days': '30',
                    'interval': 'daily'
                })
                
                if not historical_data or 'prices' not in historical_data:
                    continue
                
                # Extract prices for analysis
                prices = [price[1] for price in historical_data['prices']]
                volumes = [volume[1] for volume in historical_data['total_volumes']]
                
                # Calculate technical indicators
                indicators = calculate_technical_indicators(prices)
                
                # Calculate volume change
                volume_change = 0
                if len(volumes) >= 7:
                    recent_volume = sum(volumes[-7:]) / 7
                    previous_volume = sum(volumes[-14:-7]) / 7
                    volume_change = ((recent_volume - previous_volume) / previous_volume) * 100 if previous_volume > 0 else 0
                
                # Market trend (7-day change)
                market_trend = coin.get('price_change_percentage_7d_in_currency', 0) or 0
                
                # Generate recommendation score
                score = generate_recommendation_score(indicators, volume_change, market_trend)
                
                # Only include coins with score > 60
                if score > 60:
                    # Determine target price (simple projection)
                    current_price = coin['current_price']
                    target_multiplier = 1 + (score - 50) / 100  # 1.1x to 1.5x based on score
                    target_price = current_price * target_multiplier
                    
                    # Determine time frame based on score
                    if score >= 80:
                        time_frame = "شهر واحد"
                    elif score >= 70:
                        time_frame = "شهرين"
                    else:
                        time_frame = "3 أشهر"
                    
                    # Generate reasons based on analysis
                    reasons = []
                    if indicators.get('rsi', 50) < 35:
                        reasons.append("مؤشر القوة النسبية يشير إلى تشبع بيعي")
                    if current_price > indicators.get('sma_20', 0):
                        reasons.append("السعر أعلى من المتوسط المتحرك 20 يوم")
                    if volume_change > 15:
                        reasons.append("زيادة كبيرة في حجم التداول")
                    if market_trend > 5:
                        reasons.append("اتجاه صاعد قوي خلال الأسبوع الماضي")
                    
                    if not reasons:
                        reasons = ["تحليل فني إيجابي عام", "مؤشرات السوق مواتية"]
                    
                    # Determine exchange (simplified logic)
                    recommended_exchange = "Binance" if coin['market_cap'] > 1000000000 else "MEXC"
                    
                    # Filter by exchange if specified
                    if exchange != 'all' and exchange.lower() != recommended_exchange.lower():
                        continue
                    
                    recommendation = {
                        'id': coin['id'],
                        'name': coin['name'],
                        'symbol': coin['symbol'].upper(),
                        'current_price': current_price,
                        'target_price': round(target_price, 6),
                        'strength': score,
                        'time_frame': time_frame,
                        'exchange': recommended_exchange,
                        'reasons': reasons[:3],  # Limit to 3 reasons
                        'potential_return': round(((target_price - current_price) / current_price) * 100, 2),
                        'risk_level': 'منخفضة' if score >= 80 else 'متوسطة' if score >= 70 else 'عالية',
                        'last_updated': datetime.now().isoformat()
                    }
                    
                    recommendations.append(recommendation)
                
                # Add small delay to avoid rate limiting
                time.sleep(0.1)
                
            except Exception as e:
                print(f"Error analyzing {coin['name']}: {e}")
                continue
        
        # Sort by strength score
        recommendations.sort(key=lambda x: x['strength'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': recommendations[:10],  # Return top 10 recommendations
            'total': len(recommendations),
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@crypto_bp.route('/coin/<coin_id>', methods=['GET'])
def get_coin_details(coin_id):
    """Get detailed information about a specific coin"""
    try:
        # Get coin data
        coin_data = get_coingecko_data(f'coins/{coin_id}', {
            'localization': False,
            'tickers': False,
            'market_data': True,
            'community_data': False,
            'developer_data': False,
            'sparkline': True
        })
        
        if not coin_data:
            return jsonify({'error': 'Coin not found'}), 404
        
        # Get price history
        price_history = get_coingecko_data(f'coins/{coin_id}/market_chart', {
            'vs_currency': 'usd',
            'days': '7',
            'interval': 'hourly'
        })
        
        result = {
            'id': coin_data['id'],
            'name': coin_data['name'],
            'symbol': coin_data['symbol'].upper(),
            'current_price': coin_data['market_data']['current_price']['usd'],
            'market_cap': coin_data['market_data']['market_cap']['usd'],
            'volume_24h': coin_data['market_data']['total_volume']['usd'],
            'price_change_24h': coin_data['market_data']['price_change_percentage_24h'],
            'price_change_7d': coin_data['market_data']['price_change_percentage_7d'],
            'price_history': price_history['prices'] if price_history else [],
            'description': coin_data.get('description', {}).get('en', '')[:200] + '...' if coin_data.get('description', {}).get('en') else '',
            'last_updated': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': result
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@crypto_bp.route('/exchanges', methods=['GET'])
def get_exchange_info():
    """Get information about supported exchanges"""
    exchanges = [
        {
            'id': 'binance',
            'name': 'Binance',
            'description': 'أكبر منصة تداول عملات رقمية في العالم',
            'website': 'https://www.binance.com',
            'supported': True,
            'features': ['تداول فوري', 'تداول بالهامش', 'عقود آجلة', 'تخزين آمن']
        },
        {
            'id': 'mexc',
            'name': 'MEXC',
            'description': 'منصة تداول متقدمة مع عملات متنوعة',
            'website': 'https://www.mexc.com',
            'supported': True,
            'features': ['تداول فوري', 'عملات جديدة', 'رسوم منخفضة', 'واجهة سهلة']
        }
    ]
    
    return jsonify({
        'success': True,
        'data': exchanges
    })

