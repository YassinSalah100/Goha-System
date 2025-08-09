import { useCallback } from 'react'

interface ReceiptItem {
  id: string
  name: string
  quantity: number
  basePrice: number
  size?: string
  extras?: Array<{
    name: string
    price: number
    quantity: number
  }>
  notes?: string
}

interface ReceiptData {
  orderId: string
  cart: ReceiptItem[]
  orderType: string
  customerName?: string
  cashierName?: string
  calculateTotal: () => number
}

export const useReceipts = () => {
  const getOrderTypeDisplayText = useCallback((orderType: string) => {
    switch(orderType) {
      case 'dine-in': return 'تناول في المطعم'
      case 'takeaway': return 'طلب خارجي'
      case 'delivery': return 'توصيل'
      default: return 'طلب'
    }
  }, [])

  const printCustomerReceipt = useCallback((data: ReceiptData) => {
    const { orderId, cart, orderType, customerName, cashierName, calculateTotal } = data
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Segoe UI', sans-serif;
            margin: 0;
            padding: 8px;
            font-size: 12px;
            line-height: 1.3;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 12px;
            border-bottom: 2px solid #333;
            padding-bottom: 8px;
          }
          .logo {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #3b82f6;
            color: white;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            margin-bottom: 4px;
          }
          .title {
            font-size: 16px;
            font-weight: bold;
            margin: 4px 0;
          }
          .subtitle {
            font-size: 10px;
            color: #666;
          }
          .info {
            margin: 12px 0;
            font-size: 11px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          .items {
            margin: 12px 0;
          }
          .items-header {
            text-align: center;
            font-weight: bold;
            background: #f0f0f0;
            padding: 4px;
            margin-bottom: 8px;
          }
          .item {
            border-bottom: 1px dotted #ccc;
            padding: 4px 0;
          }
          .item-main {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
          }
          .item-details {
            font-size: 10px;
            color: #666;
            margin-top: 2px;
          }
          .total {
            text-align: center;
            border-top: 2px solid #333;
            padding-top: 8px;
            margin-top: 12px;
            font-size: 14px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 12px;
            border-top: 1px solid #ccc;
            padding-top: 8px;
            font-size: 10px;
          }
          .powered-by {
            color: #666;
            font-size: 9px;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🥘</div>
          <div class="title">دوار جحا</div>
          <div class="subtitle">Restaurant & Café</div>
        </div>
        
        <div class="info">
          <div class="info-row">
            <span>رقم الطلب:</span>
            <span>#${orderId}</span>
          </div>
          <div class="info-row">
            <span>التاريخ:</span>
            <span>${new Date().toLocaleDateString("ar-EG")}</span>
          </div>
          <div class="info-row">
            <span>الوقت:</span>
            <span>${new Date().toLocaleTimeString("ar-EG")}</span>
          </div>
          <div class="info-row">
            <span>النوع:</span>
            <span>${getOrderTypeDisplayText(orderType)}</span>
          </div>
          <div class="info-row">
            <span>الكاشير:</span>
            <span>${cashierName || "كاشير"}</span>
          </div>
          <div class="info-row">
            <span>العميل:</span>
            <span>${customerName || "عميل عابر"}</span>
          </div>
        </div>
        
        <div class="items">
          <div class="items-header">الطلبات</div>
          ${cart.map(item => `
            <div class="item">
              <div class="item-main">
                <span>${item.quantity}× ${item.name}${item.size && item.size !== "عادي" ? ` - ${item.size}` : ''}</span>
                <span>ج.م${((item.basePrice * item.quantity) + (item.extras?.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0) || 0)).toFixed(2)}</span>
              </div>
              ${item.extras && item.extras.length > 0 ? `
                <div class="item-details">
                  إضافات: ${item.extras.map(extra => extra.name).join(", ")}
                </div>
              ` : ''}
              ${item.notes ? `
                <div class="item-details">
                  ملاحظات: ${item.notes}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="total">
          الإجمالي: ج.م${calculateTotal().toFixed(2)}
        </div>
        
        <div class="footer">
          <div>شكراً لزيارتكم! 🙏</div>
          <div>نتطلع لرؤيتكم مرة أخرى</div>
          <div class="powered-by">Powered by EthReal</div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(receiptHTML)
      printWindow.document.close()
      printWindow.print()
      printWindow.close()
    }
  }, [getOrderTypeDisplayText])

  const printKitchenReceipt = useCallback((data: ReceiptData) => {
    const { orderId, cart, orderType, customerName } = data
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Segoe UI', sans-serif;
            margin: 0;
            padding: 8px;
            font-size: 12px;
            line-height: 1.3;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 12px;
            border-bottom: 2px solid #333;
            padding-bottom: 8px;
          }
          .logo {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #10b981;
            color: white;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            margin-bottom: 4px;
          }
          .title {
            font-size: 16px;
            font-weight: bold;
            margin: 4px 0;
          }
          .subtitle {
            font-size: 10px;
            color: #666;
          }
          .info {
            margin: 12px 0;
            font-size: 11px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          .items {
            margin: 12px 0;
          }
          .items-header {
            text-align: center;
            font-weight: bold;
            background: #f0f0f0;
            padding: 4px;
            margin-bottom: 8px;
          }
          .item {
            border-bottom: 1px dotted #ccc;
            padding: 4px 0;
          }
          .item-main {
            font-weight: bold;
            font-size: 13px;
          }
          .item-details {
            font-size: 10px;
            color: #666;
            margin-top: 2px;
          }
          .notes {
            background: #fef2f2;
            padding: 4px;
            border-left: 3px solid #dc2626;
            margin-top: 4px;
            font-weight: bold;
            color: #dc2626;
          }
          .prep-time {
            text-align: center;
            border-top: 2px solid #333;
            padding-top: 8px;
            margin-top: 12px;
            font-size: 14px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 12px;
            border-top: 1px solid #ccc;
            padding-top: 8px;
            font-size: 10px;
          }
          .powered-by {
            color: #666;
            font-size: 9px;
            margin-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🍳</div>
          <div class="title">دوار جحا</div>
          <div class="subtitle">فاتورة المطبخ</div>
        </div>
        
        <div class="info">
          <div class="info-row">
            <span>رقم الطلب:</span>
            <span>#${orderId}</span>
          </div>
          <div class="info-row">
            <span>الوقت:</span>
            <span>${new Date().toLocaleTimeString("ar-EG")}</span>
          </div>
          <div class="info-row">
            <span>النوع:</span>
            <span>${getOrderTypeDisplayText(orderType)}</span>
          </div>
          <div class="info-row">
            <span>العميل:</span>
            <span>${customerName || "عميل عابر"}</span>
          </div>
        </div>
        
        <div class="items">
          <div class="items-header">قائمة الطبخ</div>
          ${cart.map(item => `
            <div class="item">
              <div class="item-main">
                ${item.quantity}× ${item.name}${item.size && item.size !== "عادي" ? ` - ${item.size}` : ''}
              </div>
              ${item.extras && item.extras.length > 0 ? `
                <div class="item-details">
                  إضافات: ${item.extras.map(extra => extra.name).join(", ")}
                </div>
              ` : ''}
              ${item.notes ? `
                <div class="notes">
                  ⚠️ ملاحظات مهمة: ${item.notes}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="prep-time">
          ⏱️ وقت التحضير المتوقع: ${cart.length * 5} دقيقة
        </div>
        
        <div class="footer">
          <div>🔥 طبخ سعيد!</div>
          <div>تأكد من جودة الطعام قبل التقديم</div>
          <div class="powered-by">Powered by EthReal</div>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(receiptHTML)
      printWindow.document.close()
      printWindow.print()
      printWindow.close()
    }
  }, [getOrderTypeDisplayText])

  const printBothReceipts = useCallback((data: ReceiptData) => {
    // Print customer receipt first
    printCustomerReceipt(data)
    
    // Wait a moment, then print kitchen receipt
    setTimeout(() => {
      printKitchenReceipt(data)
    }, 1000)
  }, [printCustomerReceipt, printKitchenReceipt])

  return {
    printCustomerReceipt,
    printKitchenReceipt,
    printBothReceipts
  }
}
