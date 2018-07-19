export default function transformer(file, api) {
  const j = api.jscodeshift;

  return j(file.source)
    .find(j.ExportDefaultDeclaration)
    .map(path => {
      const { declaration } = path.value;

      if (
        !(
          declaration.type === "ClassDeclaration" &&
          Array.isArray(declaration.decorators)
        )
      ) {
        return path;
      }

      const { decorators, id: { name } } = declaration;
      delete declaration.decorators;

      let decorated;

      if (decorators.length > 1) {
        decorated = j.callExpression(
          j.callExpression(
            j.identifier("compose"),
            decorators.map(d => d.expression)
          ),
          [j.identifier(name)]
        );
      } else {
        const [decorator] = decorators;

        decorated = j.callExpression(decorator.expression, [
          j.identifier(name)
        ]);
      }

      const exportDefault = j.exportDefaultDeclaration(decorated);

      return path.replace(
        `${j(declaration).toSource()}\n\n${j(exportDefault).toSource()}`
      );
    })
    .toSource();
}
