import * as o from '../output/output_ast';
import { CompileQuery } from './compile_query';
import { NameResolver } from './expression_converter';
import { CompileElement, CompileNode } from './compile_element';
import { CompileMethod } from './compile_method';
import { ViewType } from 'angular2/src/core/linker/view_type';
import { CompileDirectiveMetadata, CompilePipeMetadata, CompileTokenMap } from '../compile_metadata';
import { CompilerConfig } from '../config';
import { CompileBinding } from './compile_binding';
export declare class CompilePipe {
    constructor();
}
export declare class CompileView implements NameResolver {
    component: CompileDirectiveMetadata;
    genConfig: CompilerConfig;
    pipeMetas: CompilePipeMetadata[];
    styles: o.Expression;
    viewIndex: number;
    declarationElement: CompileElement;
    templateVariableBindings: string[][];
    viewType: ViewType;
    viewQueries: CompileTokenMap<CompileQuery[]>;
    nodes: CompileNode[];
    rootNodesOrAppElements: o.Expression[];
    bindings: CompileBinding[];
    classStatements: o.Statement[];
    createMethod: CompileMethod;
    injectorGetMethod: CompileMethod;
    updateContentQueriesMethod: CompileMethod;
    dirtyParentQueriesMethod: CompileMethod;
    updateViewQueriesMethod: CompileMethod;
    detectChangesInInputsMethod: CompileMethod;
    detectChangesHostPropertiesMethod: CompileMethod;
    afterContentLifecycleCallbacksMethod: CompileMethod;
    afterViewLifecycleCallbacksMethod: CompileMethod;
    destroyMethod: CompileMethod;
    eventHandlerMethods: o.ClassMethod[];
    fields: o.ClassField[];
    getters: o.ClassGetter[];
    disposables: o.Expression[];
    subscriptions: o.Expression[];
    componentView: CompileView;
    pipes: Map<string, o.Expression>;
    variables: Map<string, o.Expression>;
    className: string;
    classType: o.Type;
    viewFactory: o.ReadVarExpr;
    literalArrayCount: number;
    literalMapCount: number;
    constructor(component: CompileDirectiveMetadata, genConfig: CompilerConfig, pipeMetas: CompilePipeMetadata[], styles: o.Expression, viewIndex: number, declarationElement: CompileElement, templateVariableBindings: string[][]);
    createPipe(name: string): o.Expression;
    getVariable(name: string): o.Expression;
    createLiteralArray(values: o.Expression[]): o.Expression;
    createLiteralMap(values: Array<Array<string | o.Expression>>): o.Expression;
    afterNodes(): void;
}