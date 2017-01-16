import * as Lint from 'tslint/lib';
import * as ts from 'typescript';

export class Rule extends Lint.Rules.AbstractRule {
	public apply(sourceFile: ts.SourceFile) {
		return this.applyWithWalker(new NoBracesForSingleLineArrowFunctionsWalker(sourceFile, this.getOptions()));
	}
}

class NoBracesForSingleLineArrowFunctionsWalker extends Lint.RuleWalker {
	protected visitArrowFunction(node: ts.ArrowFunction) {
		super.visitArrowFunction(node);
		const { body } = node;

		if (
			this.functionBodyIsBraced(body) &&
			this.functionBodyHasOneStatement(body) &&
			this.functionBodyIsOneLine(body)
		) {
			const sf = this.getSourceFile();
			const failureStart = body.getStart(sf);
			const fix = new Lint.Fix('no-braces-for-single-line-arrow-functions', [
				this.createReplacement(failureStart, body.getWidth(sf), this.getFixedText(body))
			]);
			this.addFailure(
				this.createFailure(
					failureStart,
					body.getWidth(sf),
					'single-line arrow functions should not be wrapped in braces',
					fix
				)
			);
		}
	}

	private functionBodyIsBraced(node: ts.ConciseBody): node is ts.Block {
		return node && node.kind === ts.SyntaxKind.Block;
	}

	private functionBodyHasOneStatement(node: ts.Block) {
		return node.statements.length === 1;
	}

	private functionBodyIsOneLine(node: ts.Block) {
		const bodyText = node.getFullText(this.getSourceFile());
		return !bodyText.match(/\n/);
	}

	private getFixedText(node: ts.Block) {
		const sf = this.getSourceFile();
		const body = node.getChildAt(1, sf);
		let result = this.stripSemicolon(body.getText(sf));
		const statement = body.getChildAt(0, sf);
		if (statement && statement.kind === ts.SyntaxKind.ReturnStatement) {
			result = result.replace('return', '').trim();

			const returnExpression = statement.getChildAt(1, sf);
			if (returnExpression && returnExpression.kind === ts.SyntaxKind.ObjectLiteralExpression) {
				result = `(${result})`;
			}
		}

		return result;
	}

	private stripSemicolon(text: string) {
		return text.trim().replace(/;$/, '');
	}
}
