import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { primaryGrey } from '../../../../utils/styling/Colors';
import useElementSize from '../../../../utils/styling/observer';

import useRequestEPDTree from '../../../request/useRequestEPDTree/useRequestEPDTree';

// ECharts tree does NOT write runtime collapsed/expanded state back into
// getOption() — the option data is frozen after initial render. We maintain
// our own map instead, seeded once from the initial data and toggled on click.
type EChartTreeNode = { name?: string; collapsed?: boolean; children?: EChartTreeNode[] };

const seedCollapsedMap = (node: EChartTreeNode, map: Map<string, boolean>): void => {
    if (!node?.name || !node.children?.length) return;
    map.set(node.name, node.collapsed ?? false);
    node.children.forEach((child) => seedCollapsedMap(child, map));
};

const expandedFromMap = (map: Map<string, boolean>): string[] =>
    [...map.entries()].filter(([, isCollapsed]) => !isCollapsed).map(([name]) => name);

export type TreeChartProps = {
    onExpandedChange?: (expandedNodes: string[]) => void;
};

const TreeChart: React.FC<TreeChartProps> = ({ onExpandedChange }) => { 

    const { containerRef, size } = useElementSize(); 

    const { res, status } = useRequestEPDTree();
    const treeData = useMemo(() => status === 'success' && res ? res : [], [status, res]);

    const chartRef = useRef<ReactECharts>(null);

    // Call ECharts resize() whenever the container dimensions change.
    // Without this the canvas stays at its original pixel size after a drag-resize.
    useEffect(() => {
        if (size.width === 0 && size.height === 0) return;
        chartRef.current?.getEchartsInstance()?.resize();
    }, [size.width, size.height]);
    // collapsedMap: node name → is currently collapsed?
    const collapsedMapRef = useRef<Map<string, boolean>>(new Map());
    // Keep onExpandedChange stable in the click handler without adding it as a dep.
    const onExpandedChangeRef = useRef(onExpandedChange);
    useEffect(() => { onExpandedChangeRef.current = onExpandedChange; });

    // Seed the map once when data arrives, and emit the initial expanded list.
    useEffect(() => {
        if (status !== 'success' || !res) return;
        const map = new Map<string, boolean>();
        seedCollapsedMap(res as EChartTreeNode, map);
        collapsedMapRef.current = map;
        onExpandedChangeRef.current?.(expandedFromMap(map));
    }, [status, res]);

    // On each click: toggle the clicked node in our map and emit the updated list.
    // We do NOT read getOption() — ECharts never reflects runtime state there.
    const handleNodeClick = useCallback((params: { data?: EChartTreeNode }) => {
        const { name, children } = params.data ?? {};
        if (!name || !children?.length) return; // leaf — not expandable
        const map = collapsedMapRef.current;
        map.set(name, !(map.get(name) ?? false)); // toggle
        onExpandedChangeRef.current?.(expandedFromMap(map));
        console.log(map); 
    }, []);

    const option = useMemo<EChartsOption>(() => ({
        tooltip: {
            trigger: 'item',
            triggerOn: 'mousemove', 
            formatter: (params) => {
                const { name, value } = params.data as { name: string; value: number }; 
                return `<div>
                    <strong>${name}</strong><br/>
                    Rate: ${value.toFixed(2)} KgCO2eq
                </div>`;
            },
        },
        series: treeData.length > 0 ? [
            {
                type: 'tree',
                data: treeData,
                top: '5%',
                left: '10%',
                bottom: '5%',
                right: '10%',
                symbolSize: 0, 
                itemStyle: { color: 'transparent' },
                edgeShape: 'polyline',
                label: {
                    verticalAlign: 'middle',
                    align: 'left',
                    backgroundColor: primaryGrey,
                    borderColor: primaryGrey,
                    borderWidth: 0.25,
                    borderRadius: 6,
                    padding: [4, 8],
                    color: '#ffffff',
                    fontSize: 11,
                },
                leaves: {
                    label: {
                        verticalAlign: 'middle',
                        align: 'left',
                        backgroundColor: 'white',
                        borderColor: primaryGrey,
                        borderWidth: 0.25,
                        borderRadius: 6,
                        padding: [3, 8],
                        color: primaryGrey,
                        fontSize: 11,
                    },
                },
                roam: true, 
                emphasis: {
                    focus: 'none', //'descendant', 
                    symbolSize: 0, 
                },
                expandAndCollapse: true,
                animationDuration: 550,
                animationDurationUpdate: 750,
            },
        ] : [],
    }), [treeData]); 

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            <ReactECharts
                ref={chartRef}
                option={option}
                style={{ width: '100%', height: '100%' }}
                onEvents={{ click: handleNodeClick }}
                notMerge
                lazyUpdate
            />
        </div>
    );
};

export default TreeChart;
