import * as Lint from 'tslint/lib';
import * as ts from 'typescript';
import getClassMethods from '../helpers/getClassMethods';
import getLeadingWhitespace from '../helpers/getLeadingWhitespace';

export class Rule extends Lint.Rules.AbstractRule {
	public apply(sourceFile: ts.SourceFile) {
		return this.applyWithWalker(new ClassMethodNewlinesWalker(sourceFile, this.getOptions()));
	}
}

class ClassMethodNewlinesWalker extends Lint.RuleWalker {
	public visitClassDeclaration(node: ts.ClassDeclaration) {
		this.validate(node);
		super.visitClassDeclaration(node);
	}

	public visitClassExpression(node: ts.ClassExpression) {
		this.validate(node);
		super.visitClassExpression(node);
	}

	private validate(node: ts.ClassLikeDeclaration) {
		const sf = this.getSourceFile();
		const methods = getClassMethods(node);

		methods.reduce((previousMethod, method) => {
			const leadingWhitespace = getLeadingWhitespace(method);
			const newlineCount = leadingWhitespace.match(/\n/g).length;
			const hasComments = /\/\/|\/\*\*/g.test(leadingWhitespace);
			const isFirstMethod = method === node.members[0];
			const isInOverloadGroup = (
				method !== previousMethod &&
				method.name.getText(sf) === previousMethod.name.getText(sf)
			);
			const expectedNewlines = isFirstMethod || isInOverloadGroup ? 1 : 2;

			if (
				newlineCount < expectedNewlines ||
				(newlineCount > expectedNewlines && !hasComments)
			) {
				const newLine = leadingWhitespace.match('\r\n') ? '\r\n' : '\n';
				const start = method.name.getStart(sf);
				const width = method.name.getWidth(sf);
				const fix = new Lint.Fix('class-method-newlines', [
					this.appendText(start - leadingWhitespace.length, newLine)
				]);
				this.addFailure(
					this.createFailure(
						start,
						width,
						'class methods should be preceded by an empty line',
						fix
					)
				);
			}

			return method;
		}, methods[0]);
	}
}
