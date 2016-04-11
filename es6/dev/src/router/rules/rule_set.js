import { isBlank, isPresent, isFunction } from 'angular2/src/facade/lang';
import { BaseException } from 'angular2/src/facade/exceptions';
import { Map } from 'angular2/src/facade/collection';
import { PromiseWrapper } from 'angular2/src/facade/async';
import { RouteRule, RedirectRule, PathMatch } from './rules';
import { Route, AsyncRoute, AuxRoute, Redirect } from '../route_config/route_config_impl';
import { AsyncRouteHandler } from './route_handlers/async_route_handler';
import { SyncRouteHandler } from './route_handlers/sync_route_handler';
import { ParamRoutePath } from './route_paths/param_route_path';
import { RegexRoutePath } from './route_paths/regex_route_path';
/**
 * A `RuleSet` is responsible for recognizing routes for a particular component.
 * It is consumed by `RouteRegistry`, which knows how to recognize an entire hierarchy of
 * components.
 */
export class RuleSet {
    constructor() {
        this.rulesByName = new Map();
        // map from name to rule
        this.auxRulesByName = new Map();
        // map from starting path to rule
        this.auxRulesByPath = new Map();
        // TODO: optimize this into a trie
        this.rules = [];
        // the rule to use automatically when recognizing or generating from this rule set
        this.defaultRule = null;
    }
    /**
     * Configure additional rules in this rule set from a route definition
     * @returns {boolean} true if the config is terminal
     */
    config(config) {
        let handler;
        if (isPresent(config.name) && config.name[0].toUpperCase() != config.name[0]) {
            let suggestedName = config.name[0].toUpperCase() + config.name.substring(1);
            throw new BaseException(`Route "${config.path}" with name "${config.name}" does not begin with an uppercase letter. Route names should be CamelCase like "${suggestedName}".`);
        }
        if (config instanceof AuxRoute) {
            handler = new SyncRouteHandler(config.component, config.data);
            let routePath = this._getRoutePath(config);
            let auxRule = new RouteRule(routePath, handler, config.name);
            this.auxRulesByPath.set(routePath.toString(), auxRule);
            if (isPresent(config.name)) {
                this.auxRulesByName.set(config.name, auxRule);
            }
            return auxRule.terminal;
        }
        let useAsDefault = false;
        if (config instanceof Redirect) {
            let routePath = this._getRoutePath(config);
            let redirector = new RedirectRule(routePath, config.redirectTo);
            this._assertNoHashCollision(redirector.hash, config.path);
            this.rules.push(redirector);
            return true;
        }
        if (config instanceof Route) {
            handler = new SyncRouteHandler(config.component, config.data);
            useAsDefault = isPresent(config.useAsDefault) && config.useAsDefault;
        }
        else if (config instanceof AsyncRoute) {
            handler = new AsyncRouteHandler(config.loader, config.data);
            useAsDefault = isPresent(config.useAsDefault) && config.useAsDefault;
        }
        let routePath = this._getRoutePath(config);
        let newRule = new RouteRule(routePath, handler, config.name);
        this._assertNoHashCollision(newRule.hash, config.path);
        if (useAsDefault) {
            if (isPresent(this.defaultRule)) {
                throw new BaseException(`Only one route can be default`);
            }
            this.defaultRule = newRule;
        }
        this.rules.push(newRule);
        if (isPresent(config.name)) {
            this.rulesByName.set(config.name, newRule);
        }
        return newRule.terminal;
    }
    /**
     * Given a URL, returns a list of `RouteMatch`es, which are partial recognitions for some route.
     */
    recognize(urlParse) {
        var solutions = [];
        this.rules.forEach((routeRecognizer) => {
            var pathMatch = routeRecognizer.recognize(urlParse);
            if (isPresent(pathMatch)) {
                solutions.push(pathMatch);
            }
        });
        // handle cases where we are routing just to an aux route
        if (solutions.length == 0 && isPresent(urlParse) && urlParse.auxiliary.length > 0) {
            return [PromiseWrapper.resolve(new PathMatch(null, null, urlParse.auxiliary))];
        }
        return solutions;
    }
    recognizeAuxiliary(urlParse) {
        var routeRecognizer = this.auxRulesByPath.get(urlParse.path);
        if (isPresent(routeRecognizer)) {
            return [routeRecognizer.recognize(urlParse)];
        }
        return [PromiseWrapper.resolve(null)];
    }
    hasRoute(name) { return this.rulesByName.has(name); }
    componentLoaded(name) {
        return this.hasRoute(name) && isPresent(this.rulesByName.get(name).handler.componentType);
    }
    loadComponent(name) {
        return this.rulesByName.get(name).handler.resolveComponentType();
    }
    generate(name, params) {
        var rule = this.rulesByName.get(name);
        if (isBlank(rule)) {
            return null;
        }
        return rule.generate(params);
    }
    generateAuxiliary(name, params) {
        var rule = this.auxRulesByName.get(name);
        if (isBlank(rule)) {
            return null;
        }
        return rule.generate(params);
    }
    _assertNoHashCollision(hash, path) {
        this.rules.forEach((rule) => {
            if (hash == rule.hash) {
                throw new BaseException(`Configuration '${path}' conflicts with existing route '${rule.path}'`);
            }
        });
    }
    _getRoutePath(config) {
        if (isPresent(config.regex)) {
            if (isFunction(config.serializer)) {
                return new RegexRoutePath(config.regex, config.serializer);
            }
            else {
                throw new BaseException(`Route provides a regex property, '${config.regex}', but no serializer property`);
            }
        }
        if (isPresent(config.path)) {
            // Auxiliary routes do not have a slash at the start
            let path = (config instanceof AuxRoute && config.path.startsWith('/')) ?
                config.path.substring(1) :
                config.path;
            return new ParamRoutePath(path);
        }
        throw new BaseException('Route must provide either a path or regex property');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVsZV9zZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkaWZmaW5nX3BsdWdpbl93cmFwcGVyLW91dHB1dF9wYXRoLVZ2aXBDQlVQLnRtcC9hbmd1bGFyMi9zcmMvcm91dGVyL3J1bGVzL3J1bGVfc2V0LnRzIl0sIm5hbWVzIjpbIlJ1bGVTZXQiLCJSdWxlU2V0LmNvbnN0cnVjdG9yIiwiUnVsZVNldC5jb25maWciLCJSdWxlU2V0LnJlY29nbml6ZSIsIlJ1bGVTZXQucmVjb2duaXplQXV4aWxpYXJ5IiwiUnVsZVNldC5oYXNSb3V0ZSIsIlJ1bGVTZXQuY29tcG9uZW50TG9hZGVkIiwiUnVsZVNldC5sb2FkQ29tcG9uZW50IiwiUnVsZVNldC5nZW5lcmF0ZSIsIlJ1bGVTZXQuZ2VuZXJhdGVBdXhpbGlhcnkiLCJSdWxlU2V0Ll9hc3NlcnROb0hhc2hDb2xsaXNpb24iLCJSdWxlU2V0Ll9nZXRSb3V0ZVBhdGgiXSwibWFwcGluZ3MiOiJPQUFPLEVBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUMsTUFBTSwwQkFBMEI7T0FDaEUsRUFBQyxhQUFhLEVBQW1CLE1BQU0sZ0NBQWdDO09BQ3ZFLEVBQUMsR0FBRyxFQUE0QyxNQUFNLGdDQUFnQztPQUN0RixFQUFDLGNBQWMsRUFBQyxNQUFNLDJCQUEyQjtPQUVqRCxFQUFlLFNBQVMsRUFBRSxZQUFZLEVBQWMsU0FBUyxFQUFDLE1BQU0sU0FBUztPQUM3RSxFQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBa0IsTUFBTSxtQ0FBbUM7T0FFakcsRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHNDQUFzQztPQUMvRCxFQUFDLGdCQUFnQixFQUFDLE1BQU0scUNBQXFDO09BRzdELEVBQUMsY0FBYyxFQUFDLE1BQU0sZ0NBQWdDO09BQ3RELEVBQUMsY0FBYyxFQUFDLE1BQU0sZ0NBQWdDO0FBTTdEOzs7O0dBSUc7QUFDSDtJQUFBQTtRQUNFQyxnQkFBV0EsR0FBR0EsSUFBSUEsR0FB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TUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0E7UUFDZEEsQ0FBQ0E7UUFFREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsTUFBTUEsWUFBWUEsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDNUJBLE9BQU9BLEdBQUdBLElBQUlBLGdCQUFnQkEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsU0FBU0EsRUFBRUEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDOURBLFlBQVlBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLFlBQVlBLENBQUNBLElBQUlBLE1BQU1BLENBQUNBLFlBQVlBLENBQUNBO1FBQ3ZFQSxDQUFDQTtRQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxNQUFNQSxZQUFZQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN4Q0EsT0FBT0EsR0FBR0EsSUFBSUEsaUJBQWlCQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxFQUFFQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUM1REEsWUFBWUEsR0FBR0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsSUFBSUEsTUFBTUEsQ0FBQ0EsWUFBWUEsQ0FBQ0E7UUFDdkVBLENBQUNBO1FBQ0RBLElBQUlBLFNBQVNBLEdBQUdBLElBQUlBLENBQUNBLGFBQWFBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQzNDQSxJQUFJQSxPQUFPQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxTQUFTQSxFQUFFQSxPQUFPQSxFQUFFQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUU3REEsSUFBSUEsQ0FBQ0Esc0JBQXNCQSxDQUFDQSxPQUFPQSxDQUFDQSxJQUFJQSxFQUFFQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUV2REEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDakJBLEVBQUVBLENBQUNBLENBQUNBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLFdB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Q0EsQ0FBQ0E7UUFDbENBLENBQUNBO1FBQ0RBLE1BQU1BLElBQUlBLGFBQWFBLENBQUNBLG9EQUFvREEsQ0FBQ0EsQ0FBQ0E7SUFDaEZBLENBQUNBO0FBQ0hYLENBQUNBO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2lzQmxhbmssIGlzUHJlc2VudCwgaXNGdW5jdGlvbn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9sYW5nJztcbmltcG9ydCB7QmFzZUV4Y2VwdGlvbiwgV3JhcHBlZEV4Y2VwdGlvbn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9leGNlcHRpb25zJztcbmltcG9ydCB7TWFwLCBNYXBXcmFwcGVyLCBMaXN0V3JhcHBlciwgU3RyaW5nTWFwV3JhcHBlcn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9jb2xsZWN0aW9uJztcbmltcG9ydCB7UHJvbWlzZVdyYXBwZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvYXN5bmMnO1xuXG5pbXBvcnQge0Fic3RyYWN0UnVsZSwgUm91dGVSdWxlLCBSZWRpcmVjdFJ1bGUsIFJvdXRlTWF0Y2gsIFBhdGhNYXRjaH0gZnJvbSAnLi9ydWxlcyc7XG5pbXBvcnQge1JvdXRlLCBBc3luY1JvdXRlLCBBdXhSb3V0ZSwgUmVkaXJlY3QsIFJvdXRlRGVmaW5pdGlvbn0gZnJvbSAnLi4vcm91dGVfY29uZmlnL3JvdXRlX2NvbmZpZ19pbXBsJztcblxuaW1wb3J0IHtBc3luY1JvdXRlSGFuZGxlcn0gZnJvbSAnLi9yb3V0ZV9oYW5kbGVycy9hc3luY19yb3V0ZV9oYW5kbGVyJztcbmltcG9ydCB7U3luY1JvdXRlSGFuZGxlcn0gZnJvbSAnLi9yb3V0ZV9oYW5kbGVycy9zeW5jX3JvdXRlX2hhbmRsZXInO1xuXG5pbXBvcnQge1JvdXRlUGF0aH0gZnJvbSAnLi9yb3V0ZV9wYXRocy9yb3V0ZV9wYXRoJztcbmltcG9ydCB7UGFyYW1Sb3V0ZVBhdGh9IGZyb20gJy4vcm91dGVfcGF0aHMvcGFyYW1fcm91dGVfcGF0aCc7XG5pbXBvcnQge1JlZ2V4Um91dGVQYXRofSBmcm9tICcuL3JvdXRlX3BhdGhzL3JlZ2V4X3JvdXRlX3BhdGgnO1xuXG5pbXBvcnQge1VybH0gZnJvbSAnLi4vdXJsX3BhcnNlcic7XG5pbXBvcnQge0NvbXBvbmVudEluc3RydWN0aW9ufSBmcm9tICcuLi9pbnN0cnVjdGlvbic7XG5cblxuLyoqXG4gKiBBIGBSdWxlU2V0YCBpcyByZXNwb25zaWJsZSBmb3IgcmVjb2duaXppbmcgcm91dGVzIGZvciBhIHBhcnRpY3VsYXIgY29tcG9uZW50LlxuICogSXQgaXMgY29uc3VtZWQgYnkgYFJvdXRlUmVnaXN0cnlgLCB3aGljaCBrbm93cyBob3cgdG8gcmVjb2duaXplIGFuIGVudGlyZSBoaWVyYXJjaHkgb2ZcbiAqIGNvbXBvbmVudHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBSdWxlU2V0IHtcbiAgcnVsZXNCeU5hbWUgPSBuZXcgTWFwPHN0cmluZywgUm91dGVSdWxlPigpO1xuXG4gIC8vIG1hcCBmcm9tIG5hbWUgdG8gcnVsZVxuICBhdXhSdWxlc0J5TmFtZSA9IG5ldyBNYXA8c3RyaW5nLCBSb3V0ZVJ1bGU+KCk7XG5cbiAgLy8gbWFwIGZyb20gc3RhcnRpbmcgcGF0aCB0byBydWxlXG4gIGF1eFJ1bGVzQnlQYXRoID0gbmV3IE1hcDxzdHJpbmcsIFJvdXRlUnVsZT4oKTtcblxuICAvLyBUT0RPOiBvcHRpbWl6ZSB0aGlzIGludG8gYSB0cmllXG4gIHJ1bGVzOiBBYnN0cmFjdFJ1bGVbXSA9IFtdO1xuXG4gIC8vIHRoZSBydWxlIHRvIHVzZSBhdXRvbWF0aWNhbGx5IHdoZW4gcmVjb2duaXppbmcgb3IgZ2VuZXJhdGluZyBmcm9tIHRoaXMgcnVsZSBzZXRcbiAgZGVmYXVsdFJ1bGU6IFJvdXRlUnVsZSA9IG51bGw7XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZSBhZGRpdGlvbmFsIHJ1bGVzIGluIHRoaXMgcnVsZSBzZXQgZnJvbSBhIHJvdXRlIGRlZmluaXRpb25cbiAgICogQHJldHVybnMge2Jvb2xlYW59IHRydWUgaWYgdGhlIGNvbmZpZyBpcyB0ZXJtaW5hbFxuICAgKi9cbiAgY29uZmlnKGNvbmZpZzogUm91dGVEZWZpbml0aW9uKTogYm9vbGVhbiB7XG4gICAgbGV0IGhhbmRsZXI7XG5cbiAgICBpZiAoaXNQcmVzZW50KGNvbmZpZy5uYW1lKSAmJiBjb25maWcubmFtZVswXS50b1VwcGVyQ2FzZSgpICE9IGNvbmZpZy5uYW1lWzBdKSB7XG4gICAgICBsZXQgc3VnZ2VzdGVkTmFtZSA9IGNvbmZpZy5uYW1lWzBdLnRvVXBwZXJDYXNlKCkgKyBjb25maWcubmFtZS5zdWJzdHJpbmcoMSk7XG4gICAgICB0aHJvdyBuZXcgQmFzZUV4Y2VwdGlvbihcbiAgICAgICAgICBgUm91dGUgXCIke2NvbmZpZy5wYXRofVwiIHdpdGggbmFtZSBcIiR7Y29uZmlnLm5hbWV9XCIgZG9lcyBub3QgYmVnaW4gd2l0aCBhbiB1cHBlcmNhc2UgbGV0dGVyLiBSb3V0ZSBuYW1lcyBzaG91bGQgYmUgQ2FtZWxDYXNlIGxpa2UgXCIke3N1Z2dlc3RlZE5hbWV9XCIuYCk7XG4gICAgfVxuXG4gICAgaWYgKGNvbmZpZyBpbnN0YW5jZW9mIEF1eFJvdXRlKSB7XG4gICAgICBoYW5kbGVyID0gbmV3IFN5bmNSb3V0ZUhhbmRsZXIoY29uZmlnLmNvbXBvbmVudCwgY29uZmlnLmRhdGEpO1xuICAgICAgbGV0IHJvdXRlUGF0aCA9IHRoaXMuX2dldFJvdXRlUGF0aChjb25maWcpO1xuICAgICAgbGV0IGF1eFJ1bGUgPSBuZXcgUm91dGVSdWxlKHJvdXRlUGF0aCwgaGFuZGxlciwgY29uZmlnLm5hbWUpO1xuICAgICAgdGhpcy5hdXhSdWxlc0J5UGF0aC5zZXQocm91dGVQYXRoLnRvU3RyaW5nKCksIGF1eFJ1bGUpO1xuICAgICAgaWYgKGlzUHJlc2VudChjb25maWcubmFtZSkpIHtcbiAgICAgICAgdGhpcy5hdXhSdWxlc0J5TmFtZS5zZXQoY29uZmlnLm5hbWUsIGF1eFJ1bGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGF1eFJ1bGUudGVybWluYWw7XG4gICAgfVxuXG4gICAgbGV0IHVzZUFzRGVmYXVsdCA9IGZhbHNlO1xuXG4gICAgaWYgKGNvbmZpZyBpbnN0YW5jZW9mIFJlZGlyZWN0KSB7XG4gICAgICBsZXQgcm91dGVQYXRoID0gdGhpcy5fZ2V0Um91dGVQYXRoKGNvbmZpZyk7XG4gICAgICBsZXQgcmVkaXJlY3RvciA9IG5ldyBSZWRpcmVjdFJ1bGUocm91dGVQYXRoLCBjb25maWcucmVkaXJlY3RUbyk7XG4gICAgICB0aGlzLl9hc3NlcnROb0hhc2hDb2xsaXNpb24ocmVkaXJlY3Rvci5oYXNoLCBjb25maWcucGF0aCk7XG4gICAgICB0aGlzLnJ1bGVzLnB1c2gocmVkaXJlY3Rvcik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoY29uZmlnIGluc3RhbmNlb2YgUm91dGUpIHtcbiAgICAgIGhhbmRsZXIgPSBuZXcgU3luY1JvdXRlSGFuZGxlcihjb25maWcuY29tcG9uZW50LCBjb25maWcuZGF0YSk7XG4gICAgICB1c2VBc0RlZmF1bHQgPSBpc1ByZXNlbnQoY29uZmlnLnVzZUFzRGVmYXVsdCkgJiYgY29uZmlnLnVzZUFzRGVmYXVsdDtcbiAgICB9IGVsc2UgaWYgKGNvbmZpZyBpbnN0YW5jZW9mIEFzeW5jUm91dGUpIHtcbiAgICAgIGhhbmRsZXIgPSBuZXcgQXN5bmNSb3V0ZUhhbmRsZXIoY29uZmlnLmxvYWRlciwgY29uZmlnLmRhdGEpO1xuICAgICAgdXNlQXNEZWZhdWx0ID0gaXNQcmVzZW50KGNvbmZpZy51c2VBc0RlZmF1bHQpICYmIGNvbmZpZy51c2VBc0RlZmF1bHQ7XG4gICAgfVxuICAgIGxldCByb3V0ZVBhdGggPSB0aGlzLl9nZXRSb3V0ZVBhdGgoY29uZmlnKTtcbiAgICBsZXQgbmV3UnVsZSA9IG5ldyBSb3V0ZVJ1bGUocm91dGVQYXRoLCBoYW5kbGVyLCBjb25maWcubmFtZSk7XG5cbiAgICB0aGlzLl9hc3NlcnROb0hhc2hDb2xsaXNpb24obmV3UnVsZS5oYXNoLCBjb25maWcucGF0aCk7XG5cbiAgICBpZiAodXNlQXNEZWZhdWx0KSB7XG4gICAgICBpZiAoaXNQcmVzZW50KHRoaXMuZGVmYXVsdFJ1bGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBCYXNlRXhjZXB0aW9uKGBPbmx5IG9uZSByb3V0ZSBjYW4gYmUgZGVmYXVsdGApO1xuICAgICAgfVxuICAgICAgdGhpcy5kZWZhdWx0UnVsZSA9IG5ld1J1bGU7XG4gICAgfVxuXG4gICAgdGhpcy5ydWxlcy5wdXNoKG5ld1J1bGUpO1xuICAgIGlmIChpc1ByZXNlbnQoY29uZmlnLm5hbWUpKSB7XG4gICAgICB0aGlzLnJ1bGVzQnlOYW1lLnNldChjb25maWcubmFtZSwgbmV3UnVsZSk7XG4gICAgfVxuICAgIHJldHVybiBuZXdSdWxlLnRlcm1pbmFsO1xuICB9XG5cblxuICAvKipcbiAgICogR2l2ZW4gYSBVUkwsIHJldHVybnMgYSBsaXN0IG9mIGBSb3V0ZU1hdGNoYGVzLCB3aGljaCBhcmUgcGFydGlhbCByZWNvZ25pdGlvbnMgZm9yIHNvbWUgcm91dGUuXG4gICAqL1xuICByZWNvZ25pemUodXJsUGFyc2U6IFVybCk6IFByb21pc2U8Um91dGVNYXRjaD5bXSB7XG4gICAgdmFyIHNvbHV0aW9ucyA9IFtdO1xuXG4gICAgdGhpcy5ydWxlcy5mb3JFYWNoKChyb3V0ZVJlY29nbml6ZXI6IEFic3RyYWN0UnVsZSkgPT4ge1xuICAgICAgdmFyIHBhdGhNYXRjaCA9IHJvdXRlUmVjb2duaXplci5yZWNvZ25pemUodXJsUGFyc2UpO1xuXG4gICAgICBpZiAoaXNQcmVzZW50KHBhdGhNYXRjaCkpIHtcbiAgICAgICAgc29sdXRpb25zLnB1c2gocGF0aE1hdGNoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGhhbmRsZSBjYXNlcyB3aGVyZSB3ZSBhcmUgcm91dGluZyBqdXN0IHRvIGFuIGF1eCByb3V0ZVxuICAgIGlmIChzb2x1dGlvbnMubGVuZ3RoID09IDAgJiYgaXNQcmVzZW50KHVybFBhcnNlKSAmJiB1cmxQYXJzZS5hdXhpbGlhcnkubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIFtQcm9taXNlV3JhcHBlci5yZXNvbHZlKG5ldyBQYXRoTWF0Y2gobnVsbCwgbnVsbCwgdXJsUGFyc2UuYXV4aWxpYXJ5KSldO1xuICAgIH1cblxuICAgIHJldHVybiBzb2x1dGlvbnM7XG4gIH1cblxuICByZWNvZ25pemVBdXhpbGlhcnkodXJsUGFyc2U6IFVybCk6IFByb21pc2U8Um91dGVNYXRjaD5bXSB7XG4gICAgdmFyIHJvdXRlUmVjb2duaXplcjogUm91dGVSdWxlID0gdGhpcy5hdXhSdWxlc0J5UGF0aC5nZXQodXJsUGFyc2UucGF0aCk7XG4gICAgaWYgKGlzUHJlc2VudChyb3V0ZVJlY29nbml6ZXIpKSB7XG4gICAgICByZXR1cm4gW3JvdXRlUmVjb2duaXplci5yZWNvZ25pemUodXJsUGFyc2UpXTtcbiAgICB9XG5cbiAgICByZXR1cm4gW1Byb21pc2VXcmFwcGVyLnJlc29sdmUobnVsbCldO1xuICB9XG5cbiAgaGFzUm91dGUobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLnJ1bGVzQnlOYW1lLmhhcyhuYW1lKTsgfVxuXG4gIGNvbXBvbmVudExvYWRlZChuYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5oYXNSb3V0ZShuYW1lKSAmJiBpc1ByZXNlbnQodGhpcy5ydWxlc0J5TmFtZS5nZXQobmFtZSkuaGFuZGxlci5jb21wb25lbnRUeXBlKTtcbiAgfVxuXG4gIGxvYWRDb21wb25lbnQobmFtZTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gdGhpcy5ydWxlc0J5TmFtZS5nZXQobmFtZSkuaGFuZGxlci5yZXNvbHZlQ29tcG9uZW50VHlwZSgpO1xuICB9XG5cbiAgZ2VuZXJhdGUobmFtZTogc3RyaW5nLCBwYXJhbXM6IGFueSk6IENvbXBvbmVudEluc3RydWN0aW9uIHtcbiAgICB2YXIgcnVsZTogUm91dGVSdWxlID0gdGhpcy5ydWxlc0J5TmFtZS5nZXQobmFtZSk7XG4gICAgaWYgKGlzQmxhbmsocnVsZSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gcnVsZS5nZW5lcmF0ZShwYXJhbXMpO1xuICB9XG5cbiAgZ2VuZXJhdGVBdXhpbGlhcnkobmFtZTogc3RyaW5nLCBwYXJhbXM6IGFueSk6IENvbXBvbmVudEluc3RydWN0aW9uIHtcbiAgICB2YXIgcnVsZTogUm91dGVSdWxlID0gdGhpcy5hdXhSdWxlc0J5TmFtZS5nZXQobmFtZSk7XG4gICAgaWYgKGlzQmxhbmsocnVsZSkpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gcnVsZS5nZW5lcmF0ZShwYXJhbXMpO1xuICB9XG5cbiAgcHJpdmF0ZSBfYXNzZXJ0Tm9IYXNoQ29sbGlzaW9uKGhhc2g6IHN0cmluZywgcGF0aCkge1xuICAgIHRoaXMucnVsZXMuZm9yRWFjaCgocnVsZSkgPT4ge1xuICAgICAgaWYgKGhhc2ggPT0gcnVsZS5oYXNoKSB7XG4gICAgICAgIHRocm93IG5ldyBCYXNlRXhjZXB0aW9uKFxuICAgICAgICAgICAgYENvbmZpZ3VyYXRpb24gJyR7cGF0aH0nIGNvbmZsaWN0cyB3aXRoIGV4aXN0aW5nIHJvdXRlICcke3J1bGUucGF0aH0nYCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9nZXRSb3V0ZVBhdGgoY29uZmlnOiBSb3V0ZURlZmluaXRpb24pOiBSb3V0ZVBhdGgge1xuICAgIGlmIChpc1ByZXNlbnQoY29uZmlnLnJlZ2V4KSkge1xuICAgICAgaWYgKGlzRnVuY3Rpb24oY29uZmlnLnNlcmlhbGl6ZXIpKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVnZXhSb3V0ZVBhdGgoY29uZmlnLnJlZ2V4LCBjb25maWcuc2VyaWFsaXplcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgQmFzZUV4Y2VwdGlvbihcbiAgICAgICAgICAgIGBSb3V0ZSBwcm92aWRlcyBhIHJlZ2V4IHByb3BlcnR5LCAnJHtjb25maWcucmVnZXh9JywgYnV0IG5vIHNlcmlhbGl6ZXIgcHJvcGVydHlgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzUHJlc2VudChjb25maWcucGF0aCkpIHtcbiAgICAgIC8vIEF1eGlsaWFyeSByb3V0ZXMgZG8gbm90IGhhdmUgYSBzbGFzaCBhdCB0aGUgc3RhcnRcbiAgICAgIGxldCBwYXRoID0gKGNvbmZpZyBpbnN0YW5jZW9mIEF1eFJvdXRlICYmIGNvbmZpZy5wYXRoLnN0YXJ0c1dpdGgoJy8nKSkgP1xuICAgICAgICAgIGNvbmZpZy5wYXRoLnN1YnN0cmluZygxKSA6XG4gICAgICAgICAgY29uZmlnLnBhdGg7XG4gICAgICByZXR1cm4gbmV3IFBhcmFtUm91dGVQYXRoKHBhdGgpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgQmFzZUV4Y2VwdGlvbignUm91dGUgbXVzdCBwcm92aWRlIGVpdGhlciBhIHBhdGggb3IgcmVnZXggcHJvcGVydHknKTtcbiAgfVxufVxuIl19