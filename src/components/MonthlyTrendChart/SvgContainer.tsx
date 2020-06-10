import * as React from 'react';
import styled from 'styled-components';
import { select, scaleBand, scaleLinear } from 'd3';
import { HeaderHeight } from './Header';

interface ContainerDivProps {
    headerHeight: number;
};

const SvgContainerDiv = styled.div<ContainerDivProps>`
    position: relative;
    width: 100%;
    height: ${props=>{ return `calc(100% - ${props.headerHeight}px)`}};
`;

const margin = {
    top: 15, 
    right: 30, 
    bottom: 20, 
    left: 40
};

export type XScale = d3.ScaleBand<number>;
export type YScale = d3.ScaleLinear<number, number>;

export interface Scales {
    x: XScale;
    y: YScale;
    lastUpdateTime?: Date;
};

export interface SvgContainerData {
    svg: SVGElement;
    g: SVGGElement;
    height: number;
    width: number;
    margin: typeof margin;
}

interface Dimension {
    height: number;
    width: number;
};

interface Props {
    xDomain?: number[];
    yDomain?: number[];
};

const SvgContainer:React.FC<Props> = ({
    xDomain,
    yDomain,
    children
})=>{

    const containerRef = React.useRef<HTMLDivElement>();
    const dimensionRef = React.useRef<Dimension>();

    const [ svgContainerData, setSvgContainerData ] = React.useState<SvgContainerData>();

    const [ scales, setScales ] =  React.useState<Scales>();

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
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr(
                    "transform", 
                    `translate(${margin.left}, ${margin.top})`
                );
        
        const svgSelector = select(container)
            .select<SVGElement>('svg');

        const svg = svgSelector.node();

        const g = svgSelector
            .select<SVGGElement>('g')
            .node();

        // const xDomain = [ 0, 11 ];
        
        const xScale = scaleBand<number>()
            .range([0, width])
            .domain(xDomain);

        const yScale = scaleLinear()
            .range([height, 0])
            .domain(yDomain);

        console.log(yDomain);

        setSvgContainerData({
            svg,
            g,
            height,
            width,
            margin
        });

        setScales({
            x: xScale,
            y: yScale
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

    React.useEffect(()=>{
        init();
    }, []);

    React.useEffect(()=>{
        if(scales && xDomain && scales.x.domain().length === 0 ){
            scales.x.domain(xDomain);
            scalesOnUpdateEndHandler();
        }
    }, [ xDomain] );

    React.useEffect(()=>{
        if(scales && yDomain ){
            scales.y.domain(yDomain).nice();
            scalesOnUpdateEndHandler();
        }
    }, [ yDomain] );

    return (
        <>
            <SvgContainerDiv 
                headerHeight={HeaderHeight}
                ref={containerRef}
            ></SvgContainerDiv>
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