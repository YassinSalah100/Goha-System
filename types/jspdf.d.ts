// Type declarations for jsPDF with autoTable
declare module 'jspdf-autotable' {
  interface autoTable {
    (doc: any, options: {
      startY?: number
      head?: any[][]
      body?: any[][]
      styles?: {
        fontSize?: number
        cellPadding?: number
        fontStyle?: string
        textColor?: number | number[]
        fillColor?: number | number[]
      }
      headStyles?: {
        fillColor?: number[]
        textColor?: number
        fontStyle?: string
      }
      alternateRowStyles?: {
        fillColor?: number[]
      }
      margin?: {
        left?: number
        right?: number
        top?: number
        bottom?: number
      }
      tableWidth?: string | number
      columnStyles?: Record<number, { cellWidth?: number }>
    }): any
  }
  
  const autoTable: autoTable
  export default autoTable
}

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number
    }
  }
}
