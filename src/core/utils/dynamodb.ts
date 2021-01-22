export const putOp = (item: Record<string, any>) => ({Put: {
  TableName: process.env.TABLE_NAME!,
  Item: item
}});

export const expressionAttributes = (
  spec: Record<string, any>
) => Object.entries(spec)
  .map(([k, v]) => [
    [`#${k}`, k],
    [`:${k}`, v]
  ])
  .reduce((acc, val) => {
    acc[0].push(val[0]);
    acc[1].push(val[1]);
    return acc;
  }, [[], []])
  .reduce((acc, val, i) => {
    switch (i) {
      case 0:
        acc.ExpressionAttributeNames = Object.fromEntries(val);
        break;
      case 1:
        acc.ExpressionAttributeValues = Object.fromEntries(val);
        break;
    }
    return acc;
  }, {
    ExpressionAttributeNames: {},
    ExpressionAttributeValues: {}
  });

export const updateExpression = (spec: Record<string, any>) => {
  // const params = Object.entries(spec)
  //   .map(([k, v]) => [
  //     [`#${k}`, k],
  //     [`:${k}`, v]
  //   ])
  //   .reduce((acc, val) => {
  //     acc[0].push(val[0]);
  //     acc[1].push(val[1]);
  //     return acc;
  //   }, [[], []])
  //   .reduce((acc, val, i) => {
  //     switch (i) {
  //       case 0:
  //         acc.ExpressionAttributeNames = Object.fromEntries(val);
  //         break;
  //       case 1:
  //         acc.ExpressionAttributeValues = Object.fromEntries(val);
  //         break;
  //     }
  //     return acc;
  //   }, {
  //     ExpressionAttributeNames: {},
  //     ExpressionAttributeValues: {}
  //   });
  const params = expressionAttributes(spec);
  const eav = Object.keys(params.ExpressionAttributeValues);
  return {
    ...params,
    TableName: process.env.TABLE_NAME!,
    UpdateExpression: "SET\n" + Object.keys(params.ExpressionAttributeNames)
      .map((it, i) => `  ${it} = ${eav[i]}`)
      .join(",\n")
  };
};
