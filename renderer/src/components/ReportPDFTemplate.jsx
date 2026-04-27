import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    marginBottom: 10,
    borderBottom: '1.5pt solid #1e3a5f',
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: {},
  reportTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
  },
  reportSubtitle: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2,
  },
  headerRight: { textAlign: 'right' },
  metaText: { fontSize: 7.5, color: '#6b7280' },

  // Filter summary pill row
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  filterPill: {
    backgroundColor: '#eff6ff',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterKey: { fontSize: 7, color: '#3b82f6', fontFamily: 'Helvetica-Bold' },
  filterVal: { fontSize: 7, color: '#1e40af' },

  // Table
  table: { width: '100%' },

  // Header row
  thead: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    borderRadius: 2,
    marginBottom: 1,
  },
  thCell: {
    paddingHorizontal: 5,
    paddingVertical: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Data rows
  row: { flexDirection: 'row', borderBottom: '0.5pt solid #e5e7eb' },
  rowAlt: { flexDirection: 'row', borderBottom: '0.5pt solid #e5e7eb', backgroundColor: '#f9fafb' },
  tdCell: { paddingHorizontal: 5, paddingVertical: 3.5, color: '#111827' },
  tdMuted: { paddingHorizontal: 5, paddingVertical: 3.5, color: '#6b7280' },

  // Column widths (landscape A4 usable ~794pt)
  colNo:       { width: 28 },
  colDate:     { width: 60 },
  colCustomer: { width: 110 },
  colPart:     { width: 110 },
  colQty:      { width: 32 },
  colPl:       { width: 36 },
  colJobNo:    { width: 70 },
  colAmount:   { width: 60 },
  colRemark:   { flex: 1 },   // fills remaining space

  // Summary footer
  summary: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginTop: 6,
    paddingTop: 4,
    borderTop: '1pt solid #1e3a5f',
  },
  summaryItem: { flexDirection: 'row', gap: 4 },
  summaryLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#374151' },
  summaryValue: { fontSize: 7.5, color: '#1e3a5f', fontFamily: 'Helvetica-Bold' },

  // Page footer
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '0.5pt solid #e5e7eb',
    paddingTop: 3,
  },
  footerText: { fontSize: 6.5, color: '#9ca3af' },
});

// ─── Column config ────────────────────────────────────────────────────────────

const COLS = [
  { label: '#',        style: S.colNo,       dataStyle: S.tdCell  },
  { label: 'Date',     style: S.colDate,     dataStyle: S.tdMuted },
  { label: 'Customer', style: S.colCustomer, dataStyle: S.tdCell  },
  { label: 'Part Name',style: S.colPart,     dataStyle: S.tdCell  },
  { label: 'QTY',      style: S.colQty,      dataStyle: S.tdMuted },
  { label: 'P.L',      style: S.colPl,       dataStyle: S.tdMuted },
  { label: 'Job No',   style: S.colJobNo,    dataStyle: S.tdCell  },
  { label: 'Amount',   style: S.colAmount,   dataStyle: S.tdMuted },
  { label: 'Remark',   style: S.colRemark,   dataStyle: S.tdMuted },
];

function getRowData(card, idx) {
  return [
    String(idx + 1),
    card.date ? new Date(card.date).toLocaleDateString('en-GB') : '',
    card.customer || card.account?.acctName || '',
    card.partName || '',
    card.qty != null ? String(card.qty) : '',
    card.pl || '',
    card.jobNo || '',
    card.amount || '0.00',
    card.remark || '',
  ];
}

// ─── Template ─────────────────────────────────────────────────────────────────

export default function ReportPDFTemplate({ cards = [], reportMeta = {} }) {
  const { title, dateLabel, accountLabel, operatorLabel, generatedAt } = reportMeta;

  const totalAmount = cards.reduce((sum, c) => {
    const n = parseFloat(c.amount || '0');
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  const filterPills = [
    accountLabel  && { key: 'Account',  val: accountLabel  },
    operatorLabel && { key: 'Operator', val: operatorLabel },
    dateLabel     && { key: 'Period',   val: dateLabel     },
  ].filter(Boolean);

  return (
    <Document title={title || 'Job Card Report'}>
      <Page size="A4" orientation="landscape" style={S.page}>

        {/* Header */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <Text style={S.reportTitle}>{title || 'Job Card Report'}</Text>
            <Text style={S.reportSubtitle}>Job Card Management System</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.metaText}>Generated: {generatedAt || new Date().toLocaleString()}</Text>
            <Text style={S.metaText}>Total records: {cards.length}</Text>
          </View>
        </View>

        {/* Active filters */}
        {filterPills.length > 0 && (
          <View style={S.filterRow}>
            {filterPills.map(({ key, val }) => (
              <View key={key} style={S.filterPill}>
                <Text style={S.filterKey}>{key}: </Text>
                <Text style={S.filterVal}>{val}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Table */}
        <View style={S.table}>
          {/* Header row */}
          <View style={S.thead}>
            {COLS.map((col, i) => (
              <Text key={i} style={[S.thCell, col.style]}>{col.label}</Text>
            ))}
          </View>

          {/* Data rows */}
          {cards.length === 0 ? (
            <View style={{ padding: 12 }}>
              <Text style={{ fontSize: 8, color: '#9ca3af', textAlign: 'center' }}>
                No records found for the selected filters.
              </Text>
            </View>
          ) : (
            cards.map((card, idx) => {
              const data = getRowData(card, idx);
              const rowStyle = idx % 2 === 0 ? S.row : S.rowAlt;
              return (
                <View key={card.id} style={rowStyle}>
                  {COLS.map((col, ci) => (
                    <Text key={ci} style={[col.dataStyle, col.style]}>{data[ci]}</Text>
                  ))}
                </View>
              );
            })
          )}
        </View>

        {/* Summary */}
        <View style={S.summary}>
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>Total Records:</Text>
            <Text style={S.summaryValue}>{cards.length}</Text>
          </View>
          <View style={S.summaryItem}>
            <Text style={S.summaryLabel}>Total Amount:</Text>
            <Text style={S.summaryValue}>{totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Page footer */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>{title || 'Job Card Report'}</Text>
          <Text
            style={S.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
