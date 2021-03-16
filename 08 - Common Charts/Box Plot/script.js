async function drawBoxPlot() {
  /* ACCESS DATA */
  const data = await d3.json('../../nyc_weather_data.json');

  const dateParser = d3.timeParse('%Y-%m-%d');
  const dateAccessor = d => dateParser(d.date);
  const dateFormatter = d3.timeFormat('%b');

  const xAccessor = d => d.month;
  const yAccessor = d => d.temperatureMax;

  const dataset = [...data].sort((a, b) => dateAccessor(a) - dateAccessor(b));
  const months = d3.timeMonths(
    dateAccessor(dataset[0]),
    dateAccessor(dataset[dataset.length - 1])
  );

  const monthsData = months.map((month, index) => {
    const monthStart = month;
    const monthEnd = months[index + 1] || new Date();

    const days = dataset.filter(
      d => dateAccessor(d) > monthStart && dateAccessor(d) <= monthEnd
    );

    const median = d3.median(days, yAccessor);
    const q1 = d3.quantile(days, 0.25, yAccessor);
    const q3 = d3.quantile(days, 0.75, yAccessor);
    const iqr = q3 - q1;

    const outliers = days.filter(
      d => Math.abs(yAccessor(d) - median) > 1.5 * iqr
    );

    return {
      month: dateFormatter(month),
      median,
      q1,
      q3,
      iqr,
      outliers,
    };
  });

  /* CHART DIMENSIONS */
  const dimensions = {
    width: 600,
    height: 400,
    margin: {
      top: 40,
      right: 10,
      bottom: 10,
      left: 60,
    },
  };

  dimensions.boundedWidth =
    dimensions.width - (dimensions.margin.left + dimensions.margin.right);
  dimensions.boundedHeight =
    dimensions.height - (dimensions.margin.top + dimensions.margin.bottom);

  /* SCALES */
  const xScale = d3
    .scaleBand()
    .domain(monthsData.map(d => xAccessor(d)))
    .range([0, dimensions.boundedWidth])
    .padding(0.15);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataset, yAccessor)])
    .range([dimensions.boundedHeight, 0])
    .nice();

  /* DRAW DATA */
  const wrapper = d3
    .select('#wrapper')
    .append('svg')
    .attr('width', dimensions.width)
    .attr('height', dimensions.height);

  const bounds = wrapper
    .append('g')
    .style(
      'transform',
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`
    );

  const axisGroup = bounds.append('g');
  const boxGroup = bounds.append('g');

  const boxesGroup = boxGroup
    .selectAll('g')
    .data(monthsData)
    .enter()
    .append('g')
    .attr(
      'transform',
      d => `translate(${xScale(xAccessor(d)) + xScale.bandwidth() / 2} 0)`
    );

  boxesGroup
    .append('g')
    .selectAll('circle')
    .data(d => d.outliers)
    .enter()
    .append('circle')
    .attr('fill', 'currentColor')
    .attr('r', 2)
    .attr('cy', d => yScale(yAccessor(d)));

  boxesGroup
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', 1)
    .attr(
      'd',
      d =>
        `M ${-xScale.bandwidth() / 4} ${yScale(
          d.median + d.iqr
        )} h ${xScale.bandwidth() / 2} m ${-xScale.bandwidth() /
          4} 0 V ${yScale(d.median - d.iqr)} m ${-xScale.bandwidth() /
          4} 0 h ${xScale.bandwidth() / 2}`
    );

  boxesGroup
    .append('rect')
    .attr('fill', 'cornflowerblue')
    .attr('x', -xScale.bandwidth() / 2)
    .attr('width', xScale.bandwidth())
    .attr('y', d => yScale(d.q3))
    .attr('height', d => yScale(d.q1) - yScale(d.q3));

  boxesGroup
    .append('path')
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', 2)
    .attr(
      'd',
      d =>
        `M ${-xScale.bandwidth() / 2} ${yScale(
          d.median
        )} h ${xScale.bandwidth()}`
    );

  /* PERIPHERALS */
  const yAxisGenerator = d3
    .axisLeft()
    .scale(yScale)
    .ticks(6)
    .tickPadding(5);

  const yAxisGroup = axisGroup.append('g').call(yAxisGenerator);

  const xAxisGenerator = d3
    .axisTop()
    .scale(xScale)
    .ticks(5)
    .tickSize(0)
    .tickPadding(10);

  const xAxisGroup = axisGroup.append('g').call(xAxisGenerator);

  yAxisGroup
    .append('text')
    .text('Maximum Temperature (°F)')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', 'currentColor')
    .attr('font-size', 14)
    .style(
      'transform',
      `translate(${-dimensions.margin.left + 8}px, ${dimensions.boundedHeight /
        2}px) rotate(-90deg)`
    );

  axisGroup.selectAll('g.tick text').attr('font-size', 10);
  xAxisGroup.selectAll('g.tick text').attr('font-weight', 'bold');
  axisGroup.selectAll('path').remove();
}

drawBoxPlot();
