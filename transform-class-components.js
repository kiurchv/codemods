export default function transformer(file, api) {
  const j = api.jscodeshift;

  return j(file.source)
    .find(j.ClassDeclaration)
    .map(path => {
      const { id: { name }, body: { body } } = path.value;

      if (body.length !== 1) return path;

      const [method] = body;

      if (
        method.key.name !== "render" ||
        j(method)
          .find(j.VariableDeclaration)
          .size() !== 1
      )
        return path;

      const { value: { id: params } } = j(method)
        .find(j.VariableDeclarator)
        .filter(
          path =>
            path.node.init.type === "MemberExpression" &&
            path.node.init.object.type === "ThisExpression" &&
            path.node.init.property.name === "props"
        )
        .get();

      const { value: returns } = j(method)
        .find(j.ReturnStatement)
        .find(j.JSXElement)
        .get();

      return path.replace(
        j.variableDeclaration("const", [
          j.variableDeclarator(
            j.identifier(name),
            j.arrowFunctionExpression([params], returns)
          )
        ])
      );
    })
    .toSource();
}
