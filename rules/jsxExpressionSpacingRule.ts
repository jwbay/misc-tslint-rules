﻿import * as Lint from 'tslint/lib/lint';
import * as ts from 'typescript';

export class Rule extends Lint.Rules.AbstractRule {
	public apply(sourceFile: ts.SourceFile) {
		return this.applyWithWalker(new JsxExpressionSpacingWalker(sourceFile, this.getOptions()));
	}
}

class JsxExpressionSpacingWalker extends Lint.RuleWalker {
	public walkChildren(node: ts.Node) {
		if (node.kind === ts.SyntaxKind.JsxExpression) {
			this.validateNode(node as ts.JsxExpression);
		}
		super.walkChildren(node);
	}

	private validateNode(node: ts.JsxExpression) {
		const value = node.getChildAt(1);
		const closingBrace = node.getChildAt(2);

		if (!value || !this.isClosingBrace(closingBrace)) {
			return;
		}

		if (!this.isPrecededByValidWhitespace(value)) {
			this.addFailure(
				this.createFailure(
					node.getStart(),
					node.getWidth(),
					'jsx expression should have one space after opening \'{\''
				)
			);
		}

		if (!this.isPrecededByValidWhitespace(closingBrace)) {
			this.addFailure(
				this.createFailure(
					node.getStart(),
					node.getWidth(),
					'jsx expression should have one space before closing \'}\''
				)
			);
		}
	}

	private isPrecededByValidWhitespace(node: ts.Node) {
		return (
			node.getFullStart() === node.getStart() - 1 ||
			node.getFullText().match(/^[\r\n]+/)
		);
	}

	private isClosingBrace(node: ts.Node) {
		return node && node.kind === ts.SyntaxKind.CloseBraceToken;
	}
}