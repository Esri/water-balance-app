export const average = (data: number[])=>{
    const sum = data.reduce((sum, value)=>{
        return sum + value;
    }, 0);

    return sum / data.length;
};