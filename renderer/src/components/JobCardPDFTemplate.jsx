import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    textAlign: 'center',
    marginBottom: 10,
    borderBottom: '1.5pt solid #1e3a5f',
    paddingBottom: 6,
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    letterSpacing: 1,
  },
  docTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    marginTop: 3,
    letterSpacing: 0.5,
  },

  // Job No row
  jobNoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    backgroundColor: '#f0f4fa',
    padding: '4pt 8pt',
    borderRadius: 2,
  },
  jobNoItem: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  jobNoLabel: { fontFamily: 'Helvetica-Bold', color: '#1e3a5f' },
  jobNoValue: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#c00000' },

  // Section
  section: { marginBottom: 6 },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: '#ffffff',
    backgroundColor: '#1e3a5f',
    padding: '2pt 6pt',
    marginBottom: 0,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Grid table
  table: { width: '100%', borderCollapse: 'collapse' },
  row: { flexDirection: 'row' },
  cellLabel: {
    width: '18%',
    padding: '3pt 4pt',
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    backgroundColor: '#f9fafb',
    border: '0.5pt solid #d1d5db',
  },
  cellValue: {
    flex: 1,
    padding: '3pt 4pt',
    color: '#111827',
    border: '0.5pt solid #d1d5db',
    borderLeft: 'none',
  },
  cellWideLabel: {
    width: '12%',
    padding: '3pt 4pt',
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    backgroundColor: '#f9fafb',
    border: '0.5pt solid #d1d5db',
  },
  cellWideValue: {
    flex: 1,
    padding: '3pt 4pt',
    color: '#111827',
    border: '0.5pt solid #d1d5db',
    borderLeft: 'none',
  },

  // Time block (3-column: Start | End | Total)
  timeRow: { flexDirection: 'row' },
  timeCell: {
    flex: 1,
    padding: '3pt 4pt',
    border: '0.5pt solid #d1d5db',
  },
  timeCellBorderless: {
    flex: 1,
    padding: '3pt 4pt',
    border: '0.5pt solid #d1d5db',
    borderLeft: 'none',
  },
  timeCellLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    backgroundColor: '#f9fafb',
  },
  timeCellValue: { color: '#111827' },
  subLabel: { fontSize: 6.5, color: '#6b7280', marginBottom: 1 },

  // Remark
  remarkRow: { flexDirection: 'row', marginTop: 0 },
  remarkLabel: {
    width: '12%',
    padding: '4pt 4pt',
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    backgroundColor: '#f9fafb',
    border: '0.5pt solid #d1d5db',
  },
  remarkValue: {
    flex: 1,
    padding: '4pt',
    minHeight: 28,
    border: '0.5pt solid #d1d5db',
    borderLeft: 'none',
    color: '#111827',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 28,
    right: 28,
    borderTop: '0.5pt solid #d1d5db',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 7, color: '#9ca3af' },
});

// ─── Helper components ────────────────────────────────────────────────────────

function LabelValue({ label, value, labelWidth = '18%' }) {
  return (
    <View style={S.row}>
      <Text style={[S.cellLabel, { width: labelWidth }]}>{label}</Text>
      <Text style={S.cellValue}>{value || ''}</Text>
    </View>
  );
}

function TwoColumns({ pairs }) {
  // pairs: [{ label, value }, { label, value }]
  return (
    <View style={S.row}>
      {pairs.map((p, i) => (
        <View key={i} style={{ flex: 1, flexDirection: 'row' }}>
          <Text style={[S.cellLabel, i > 0 && { borderLeft: 'none' }]}>{p.label}</Text>
          <Text style={[S.cellValue, { borderLeft: 'none' }]}>{p.value || ''}</Text>
        </View>
      ))}
    </View>
  );
}

function TimeSection({ title, startLabel, endLabel, startValue, endValue, totalValue }) {
  return (
    <View style={S.section}>
      <Text style={S.sectionTitle}>{title}</Text>
      <View style={S.timeRow}>
        <View style={[S.timeCell, S.timeCellLabel, { flex: 1 }]}>
          <Text style={S.subLabel}>{startLabel || 'Start Time'}</Text>
          <Text style={S.timeCellValue}>{startValue || ''}</Text>
        </View>
        <View style={[S.timeCellBorderless, { flex: 1 }]}>
          <Text style={S.subLabel}>{endLabel || 'End Time'}</Text>
          <Text style={S.timeCellValue}>{endValue || ''}</Text>
        </View>
        <View style={[S.timeCellBorderless, { flex: 1 }]}>
          <Text style={S.subLabel}>Total Time</Text>
          <Text style={[S.timeCellValue, { fontFamily: 'Helvetica-Bold' }]}>{totalValue || ''}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Template ────────────────────────────────────────────────────────────

export default function JobCardPDFTemplate({ jobCard }) {
  const card = jobCard || {};
  const account = card.account || {};
  const printDate = new Date().toLocaleDateString('en-GB');
  const cardDate  = card.date ? new Date(card.date).toLocaleDateString('en-GB') : '';

  // Extra fields (settings-defined)
  const extra = typeof card.extraFields === 'string'
    ? JSON.parse(card.extraFields)
    : (card.extraFields || {});
  const extraEntries = Object.entries(extra).filter(([, v]) =>
    v !== null && v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)
  );

  return (
    <Document title={`Job Card — ${card.jobNo}`}>
      <Page size="A4" style={S.page}>

        {/* ── Company Header ── */}
        <View style={S.header}>
          <Text style={S.companyName}>JOB CARD</Text>
          <Text style={S.docTitle}>MANUFACTURING WORK ORDER</Text>
        </View>

        {/* ── Job No / Date Banner ── */}
        <View style={S.jobNoRow}>
          <View style={S.jobNoItem}>
            <Text style={S.jobNoLabel}>JOB NO:</Text>
            <Text style={S.jobNoValue}>{card.jobNo || ''}</Text>
          </View>
          <View style={S.jobNoItem}>
            <Text style={S.jobNoLabel}>DATE:</Text>
            <Text style={S.jobNoValue}>{cardDate}</Text>
          </View>
          <View style={S.jobNoItem}>
            <Text style={S.jobNoLabel}>AMOUNT:</Text>
            <Text style={S.jobNoValue}>{card.amount || '0.00'}</Text>
          </View>
        </View>

        {/* ── Account / Customer Details ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Customer Details</Text>
          <View style={S.table}>
            <TwoColumns pairs={[
              { label: 'Account',  value: account.acctName },
              { label: 'Customer', value: card.customer },
            ]} />
            <TwoColumns pairs={[
              { label: 'Address',  value: account.address },
              { label: 'City',     value: account.city },
            ]} />
            <TwoColumns pairs={[
              { label: 'Contact',  value: account.contactPerson },
              { label: 'Fax',      value: account.fax },
            ]} />
          </View>
        </View>

        {/* ── Order Details ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Order Details</Text>
          <View style={S.table}>
            <TwoColumns pairs={[
              { label: 'Cont No',  value: card.contNo },
              { label: 'L.C.C No', value: card.lcCNo },
            ]} />
            <TwoColumns pairs={[
              { label: 'O.G.C No', value: card.ogcNo },
              { label: 'P.O. No',  value: card.poNo },
            ]} />
            <TwoColumns pairs={[
              { label: 'Bill No',  value: card.billNo },
              { label: 'DWG No',   value: card.dwgNo },
            ]} />
            <TwoColumns pairs={[
              { label: 'Part Name', value: card.partName },
              { label: 'QTY',       value: card.qty != null ? String(card.qty) : '' },
            ]} />
          </View>
        </View>

        {/* ── Time Sections ── */}
        <TimeSection
          title="Setting"
          startLabel="Setting Start"
          endLabel="Setting End"
          startValue={card.settingStartTime}
          endValue={card.settingEndTime}
          totalValue={card.settingTotalTime}
        />
        <TimeSection
          title="Job"
          startLabel="Job Start Time"
          endLabel="Job End Time"
          startValue={card.jobStartTime}
          endValue={card.jobEndTime}
          totalValue={card.jobTotalTime}
        />
        <TimeSection
          title="M/C Hours"
          startLabel="M/C Hrs Start"
          endLabel="M/C Hrs End"
          startValue={card.mcHrsStart}
          endValue={card.mcHrsEnd}
          totalValue={card.mcTotalTime}
        />

        {/* ── Specifications ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Specifications</Text>
          <View style={S.table}>
            <TwoColumns pairs={[
              { label: 'PL',        value: card.pl },
              { label: 'Thickness', value: card.thickness },
            ]} />
            <TwoColumns pairs={[
              { label: 'Taper',     value: card.taper },
              { label: 'Prog No',   value: card.progNo },
            ]} />
            <TwoColumns pairs={[
              { label: 'Operator',  value: card.operator },
              { label: 'Amount',    value: card.amount },
            ]} />
          </View>
        </View>

        {/* ── Remark ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Remark</Text>
          <View style={S.remarkRow}>
            <Text style={S.remarkValue}>{card.remark || ''}</Text>
          </View>
        </View>

        {/* ── Extra Fields (if any) ── */}
        {extraEntries.length > 0 && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>Additional Information</Text>
            <View style={S.table}>
              {extraEntries.map(([key, val]) => (
                <LabelValue
                  key={key}
                  label={key.replace(/_/g, ' ')}
                  value={Array.isArray(val) ? val.join(', ') : String(val)}
                  labelWidth="22%"
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Signatures ── */}
        <View style={{ flexDirection: 'row', marginTop: 16, gap: 20 }}>
          {['Prepared By', 'Checked By', 'Approved By'].map(label => (
            <View key={label} style={{ flex: 1 }}>
              <View style={{ borderBottom: '0.5pt solid #9ca3af', marginBottom: 3, height: 20 }} />
              <Text style={{ fontSize: 7, color: '#6b7280', textAlign: 'center' }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          <Text style={S.footerText}>Job Card: {card.jobNo || ''}</Text>
          <Text style={S.footerText}>Printed: {printDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
