import styles from './OwnerPortal.module.css';

const buildPoints = (values, maxY, width, height, left, top, right, bottom) => {
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  return values.map((value, index) => {
    const x = left + (plotWidth * index) / Math.max(values.length - 1, 1);
    const y = top + plotHeight - (Math.max(0, Math.min(value, maxY)) / maxY) * plotHeight;
    return { x, y, value };
  });
};

export function AxisLineChart({
  values,
  xLabels,
  maxY,
  yStep,
  color = '#3b82f6',
  fill = false,
  height = 250,
  legend,
}) {
  const width = 720;
  const left = 58;
  const right = 18;
  const top = 16;
  const bottom = 46;
  const points = buildPoints(values, maxY, width, height, left, top, right, bottom);
  const pointString = points.map((point) => `${point.x},${point.y}`).join(' ');
  const baseY = height - bottom;
  const areaPoints = `${left},${baseY} ${pointString} ${width - right},${baseY}`;
  const ticks = [];
  for (let value = 0; value <= maxY; value += yStep) ticks.push(value);

  return (
    <div className={styles.axisChartWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.axisChartSvg} preserveAspectRatio="none" role="img">
        {ticks.map((tick) => {
          const y = top + (height - top - bottom) - (tick / maxY) * (height - top - bottom);
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y} y2={y} className={styles.axisGridLine} />
              <text x={left - 10} y={y + 4} textAnchor="end" className={styles.axisTickText}>{tick.toLocaleString('en-US')}</text>
            </g>
          );
        })}
        {xLabels.map((label, index) => {
          const x = left + ((width - left - right) * index) / Math.max(xLabels.length - 1, 1);
          return <text key={label} x={x} y={height - 16} textAnchor="middle" className={styles.axisTickText}>{label}</text>;
        })}
        <line x1={left} x2={left} y1={top} y2={baseY} className={styles.axisBaseLine} />
        <line x1={left} x2={width - right} y1={baseY} y2={baseY} className={styles.axisBaseLine} />
        {fill && <polygon points={areaPoints} fill={color} opacity="0.14" />}
        <polyline points={pointString} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="4" fill="#fff" stroke={color} strokeWidth="3" />)}
      </svg>
      {legend && <div className={styles.chartLegend}><span><i style={{ background: color }} />{legend}</span></div>}
    </div>
  );
}

export function AxisMultiLineChart({
  series,
  xLabels,
  maxY,
  yStep,
  height = 250,
}) {
  const width = 720;
  const left = 58;
  const right = 18;
  const top = 16;
  const bottom = 46;
  const ticks = [];
  for (let value = 0; value <= maxY; value += yStep) ticks.push(value);
  const baseY = height - bottom;

  return (
    <div className={styles.axisChartWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.axisChartSvg} preserveAspectRatio="none" role="img">
        {ticks.map((tick) => {
          const y = top + (height - top - bottom) - (tick / maxY) * (height - top - bottom);
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y} y2={y} className={styles.axisGridLine} />
              <text x={left - 10} y={y + 4} textAnchor="end" className={styles.axisTickText}>{tick}</text>
            </g>
          );
        })}
        {xLabels.map((label, index) => {
          const x = left + ((width - left - right) * index) / Math.max(xLabels.length - 1, 1);
          return <text key={label} x={x} y={height - 16} textAnchor="middle" className={styles.axisTickText}>{label}</text>;
        })}
        <line x1={left} x2={left} y1={top} y2={baseY} className={styles.axisBaseLine} />
        <line x1={left} x2={width - right} y1={baseY} y2={baseY} className={styles.axisBaseLine} />
        {series.map((item) => {
          const points = buildPoints(item.values, maxY, width, height, left, top, right, bottom);
          return (
            <g key={item.label}>
              <polyline points={points.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke={item.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="4" fill="#fff" stroke={item.color} strokeWidth="3" />)}
            </g>
          );
        })}
      </svg>
      <div className={styles.chartLegend}>{series.map((item) => <span key={item.label}><i style={{ background: item.color }} />{item.label}</span>)}</div>
    </div>
  );
}

export function AxisBarChart({
  values,
  xLabels,
  maxY,
  yStep,
  color = '#8b5cf6',
  height = 250,
  legend,
}) {
  const width = 720;
  const left = 58;
  const right = 18;
  const top = 16;
  const bottom = 46;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const band = plotWidth / values.length;
  const barWidth = Math.min(100, band * 0.62);
  const ticks = [];
  for (let value = 0; value <= maxY; value += yStep) ticks.push(value);
  const baseY = height - bottom;

  return (
    <div className={styles.axisChartWrap}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.axisChartSvg} preserveAspectRatio="none" role="img">
        {ticks.map((tick) => {
          const y = top + plotHeight - (tick / maxY) * plotHeight;
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y} y2={y} className={styles.axisGridLine} />
              <text x={left - 10} y={y + 4} textAnchor="end" className={styles.axisTickText}>{tick.toLocaleString('en-US')}</text>
            </g>
          );
        })}
        <line x1={left} x2={left} y1={top} y2={baseY} className={styles.axisBaseLine} />
        <line x1={left} x2={width - right} y1={baseY} y2={baseY} className={styles.axisBaseLine} />
        {values.map((value, index) => {
          const barHeight = (value / maxY) * plotHeight;
          const x = left + band * index + (band - barWidth) / 2;
          const y = baseY - barHeight;
          return (
            <g key={`${xLabels[index]}-${value}`}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx="8" fill={color} />
              <text x={left + band * index + band / 2} y={height - 16} textAnchor="middle" className={styles.axisTickText}>{xLabels[index]}</text>
            </g>
          );
        })}
      </svg>
      {legend && <div className={styles.chartLegend}><span><i style={{ background: color }} />{legend}</span></div>}
    </div>
  );
}

export function ConversionFunnelChart() {
  const stages = [
    { label: 'Applications', value: 1245 },
    { label: 'Interviews', value: 345 },
    { label: 'Offers', value: 95 },
    { label: 'Accepted', value: 68 },
  ];
  const max = 1400;
  const ticks = [0, 350, 700, 1050, 1400];
  return (
    <div className={styles.horizontalAxisChart}>
      <div className={styles.horizontalRows}>
        {stages.map((stage) => (
          <div key={stage.label} className={styles.horizontalRow}>
            <span>{stage.label}</span>
            <div className={styles.horizontalPlot}>
              <div className={styles.horizontalGridLines}>{ticks.map((tick) => <i key={tick} style={{ left: `${(tick / max) * 100}%` }} />)}</div>
              <div className={styles.horizontalBar} style={{ width: `${(stage.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.horizontalTicks}>{ticks.map((tick) => <span key={tick} style={{ left: `${(tick / max) * 100}%` }}>{tick.toLocaleString('en-US')}</span>)}</div>
    </div>
  );
}

export function PieChart({ segments }) {
  let current = 0;
  const stops = segments.map((segment) => {
    const start = current;
    current += segment.value;
    return `${segment.color} ${start}% ${current}%`;
  }).join(', ');
  return <div className={styles.pieChart} style={{ background: `conic-gradient(${stops})` }} />;
}

export function GroupedBarChart({ groups, series, maxY, yStep, height = 250 }) {
  const ticks = [];
  for (let value = 0; value <= maxY; value += yStep) ticks.push(value);
  return (
    <div className={styles.groupedChart} style={{ minHeight: height }}>
      <div className={styles.groupedYAxis}>{ticks.slice().reverse().map((tick) => <span key={tick}>{tick.toLocaleString('en-US')}</span>)}</div>
      <div className={styles.groupedPlot}>
        <div className={styles.groupedGrid}>{ticks.map((tick) => <i key={tick} style={{ bottom: `${(tick / maxY) * 100}%` }} />)}</div>
        <div className={styles.groupedBars}>
          {groups.map((group, groupIndex) => (
            <div key={group} className={styles.groupedBand}>
              <div className={styles.groupedBarCluster}>
                {series.map((item) => <span key={item.label} style={{ height: `${(item.values[groupIndex] / maxY) * 100}%`, background: item.color }} />)}
              </div>
              <small>{group}</small>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.chartLegend}>{series.map((item) => <span key={item.label}><i style={{ background: item.color }} />{item.label}</span>)}</div>
    </div>
  );
}
