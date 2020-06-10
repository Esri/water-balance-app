import * as React from 'react';
import { 
    select,
    scaleTime,
    scaleBand,
    scaleLinear,
    zoom as d3Zoom,
    event as d3Event
} from 'd3';
import useWindowSize from '../../hooks/useWindowSize';
import { HeaderHeight } from './Header';

const margin = {
    top: 20, 
    right: 30, 
    bottom: 20, 
    left: 40
};

const ChartClipPathId = 'gldasChartClip';

interface Dimension {
    height: number;
    width: number;
};

export type XScale = d3.ScaleTime<number, number>;
export type XScaleBand = d3.ScaleBand<number>;
export type YScale = d3.ScaleLinear<number, number>;

export interface Scales {
    x: XScale;
    y: YScale;
    xScaleBand: XScaleBand;
    lastUpdateTime?: Date;
};

export interface SvgContainerData {
    svg: SVGElement;
    g: SVGGElement;
    margin: typeof margin;
    clipPathId: string;
    dimension?: Dimension
}

interface Props {
    timeExtent?: Date[];
    yDomain?: number[];
};

const SvgContainer:React.FC<Props> = ({
    timeExtent,
    yDomain = [0,0],
    children
})=>{

    const containerRef = React.useRef<HTMLDivElement>();
    const dimensionRef = React.useRef<Dimension>();

    const [ svgContainerData, setSvgContainerData ] = React.useState<SvgContainerData>();

    const [ scales, setScales ] =  React.useState<Scales>();

    const windowSize = useWindowSize();

    const init = ()=>{

        const container = containerRef.current;
        const width = container.offsetWidth - margin.left - margin.right;
        const height = container.offsetHeight - margin.top - margin.bottom;

        dimensionRef.current = {
            height,
            width
        };

        select(container)
            .append("svg")
                .attr("width", '100%')
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr(
                    "transform", 
                    `translate(${margin.left}, ${margin.top})`
                );
        
        const svgSelector = select(container)
            .select<SVGElement>('svg');

        const chartAreaClip = svgSelector.select('g')
            .append('clipPath')
                .attr('id', ChartClipPathId)
            .append('rect')
                .attr("width", width)
                .attr("height", height)
        
        // console.log(chartAreaClip)
        
        const svg = svgSelector.node();

        const g = svgSelector
            .select<SVGGElement>('g')
            .node();

        const xDomain = [ 
            timeExtent[0], 
            timeExtent[timeExtent.length - 1]
        ];
        
        const xScale = scaleTime<number, number>()
            .range([0, width])
            .domain(xDomain);

        const xScaleBand = scaleBand<number>()
            .paddingInner(0.2)
            .range([0, width])
            .domain(timeExtent.map(d=>d.getTime()));

        const yScale = scaleLinear()
            .range([height, 0])
            .domain(yDomain);

        setSvgContainerData({
            svg,
            g,
            margin,
            clipPathId: ChartClipPathId,
            dimension: dimensionRef.current
        });

        setScales({
            x: xScale,
            y: yScale,
            xScaleBand
        });

    };

    const scalesOnUpdateEndHandler = ()=>{
        setScales(scales=>{
            return {
                ...scales,
                // change last update time so the children components know scales have changed
                lastUpdateTime: new Date()
            }
        });
    };

    const zoom = (svg:d3.Selection<SVGElement, unknown, null, undefined>)=>{

        const { height, width } = dimensionRef.current;

        const extent: [ 
            [number, number],
            [number, number]
        ] = [
            [ margin.left, margin.top ], 
            [ width, height - margin.top ]
        ];

        svg.call(d3Zoom()
            .scaleExtent([1, 4])
            .translateExtent(extent)
            .extent(extent)
            .on("zoom", onZoomed)
        );
    };

    const onZoomed = ()=>{
        const { width } = dimensionRef.current;
        const newRange = [ 0, width ].map(d => d3Event.transform.applyX(d) as number);

        scales.x.range(newRange);

        scales.xScaleBand.range([ 
            newRange[0], 
            newRange[1] 
        ]);

        scalesOnUpdateEndHandler();
    }

    const resizeHandler = ()=>{

        const container = containerRef.current;

        if(!container || !svgContainerData || !scales){
            return;
        }

        // const { svg } = svgContainerData;
        const { x, xScaleBand } = scales;

        // const newContainerWidth = window.innerWidth - 720;
        const newWidth = container.offsetWidth - margin.left - margin.right;

        dimensionRef.current.width = newWidth;

        // d3.select(svg)
        //     .attr("width", newWidth);
        
        select(`#${ChartClipPathId}`)
            .select('rect')
            .attr("width", newWidth);

        x.range([0, newWidth ]);
        xScaleBand.range([0, newWidth ]);

        scalesOnUpdateEndHandler();
    }

    React.useEffect(()=>{
        init();
    }, []);

    React.useEffect(()=>{
        resizeHandler();
    }, [ windowSize ]);

    React.useEffect(()=>{
        if(scales && svgContainerData){
            const { svg } = svgContainerData;
            select(svg).call(zoom);
        }
    }, [scales, svgContainerData]);

    React.useEffect(()=>{
        if(scales && yDomain ){
            scales.y.domain(yDomain).nice();
            scalesOnUpdateEndHandler();
        }
    }, [ yDomain] );

    return (
        <>
            <div 
                ref={containerRef}
                style={{
                    'position': 'relative',
                    'width': '100%',
                    'height': `calc(100% - ${HeaderHeight}px)`
                }}
            ></div>
            {   
                React.Children.map(children, (child)=>{
                    return React.cloneElement(child as React.ReactElement<any>, {
                        svgContainerData,
                        scales
                    });
                })  
            }
        </>
    );
};

export default SvgContainer;