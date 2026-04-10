import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const RADIAN = Math.PI / 180;

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function ChartLegend({ data }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
      {data.map((entry) => (
        <div key={entry.name} className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <span className="h-2.5 w-2.5 shrink-0" style={{ backgroundColor: entry.fill }} />
          <span>{entry.name}</span>
          <span className="font-semibold text-on-surface">({entry.value})</span>
        </div>
      ))}
    </div>
  );
}

export function StatusDonut({ data, title }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="cell-border bg-surface p-5">
      <h3 className="label-caps text-on-surface-variant text-xs mb-3">{title}</h3>
      {total === 0 ? (
        <div className="flex items-center justify-center h-[180px] text-sm text-outline font-mono">
          No data yet
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-container)',
                  border: '1px solid rgba(169,180,185,0.15)',
                  borderRadius: 0,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <ChartLegend data={data} />
        </>
      )}
    </div>
  );
}

export function StatusBarChart({ data, title }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="cell-border bg-surface p-5">
      <h3 className="label-caps text-on-surface-variant text-xs mb-3">{title}</h3>
      {total === 0 ? (
        <div className="flex items-center justify-center h-[220px] text-sm text-outline font-mono">
          No data yet
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface-container)',
                  border: '1px solid rgba(169,180,185,0.15)',
                  borderRadius: 0,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={0} barSize={18}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <ChartLegend data={data} />
        </>
      )}
    </div>
  );
}
