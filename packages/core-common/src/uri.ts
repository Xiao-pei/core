export * from 'vscode-uri';
import Uri from 'vscode-uri';
import { Path } from './path';

export class URI {

  private readonly codeUri: Uri;
  private _path: Path | undefined;

  constructor(uri: string | Uri = '') {
    if (uri instanceof Uri) {
      this.codeUri = uri;
    } else {
      this.codeUri = Uri.parse(uri);
    }
  }

  get displayName(): string {
    const base = this.path.base;
    if (base) {
      return base;
    }
    if (this.path.isRoot) {
      return this.path.toString();
    }
    return '';
  }

  /**
   * Return all uri from the current to the top most.
   */
  get allLocations(): URI[] {
    const locations: any[] = [];
    let location: URI = this;
    while (!location.path.isRoot) {
      locations.push(location);
      location = location.parent;
    }
    locations.push(location);
    return locations;
  }

  get parent(): URI {
    if (this.path.isRoot) {
      return this;
    }
    return this.withPath(this.path.dir);
  }

  relative(uri: URI): Path | undefined {
    if (this.authority !== uri.authority || this.scheme !== uri.scheme) {
      return undefined;
    }
    return this.path.relative(uri.path);
  }

  resolve(path: string | Path): URI {
    return this.withPath(this.path.join(path.toString()));
  }

  /**
   * return a new URI replacing the current with the given scheme
   */
  withScheme(scheme: string): URI {
    const newCodeUri = Uri.from({
      ...this.codeUri.toJSON(),
      scheme
    });
    return new URI(newCodeUri);
  }

  /**
   * return this URI without a scheme
   */
  withoutScheme(): URI {
    return this.withScheme('');
  }

  /**
   * return a new URI replacing the current with the given authority
   */
  withAuthority(authority: string): URI {
    const newCodeUri = Uri.from({
      ...this.codeUri.toJSON(),
      scheme: this.codeUri.scheme,
      authority
    });
    return new URI(newCodeUri);
  }

  /**
   * return this URI without a authority
   */
  withoutAuthority(): URI {
    return this.withAuthority('');
  }

  /**
   * return a new URI replacing the current with the given path
   */
  withPath(path: string | Path): URI {
    const newCodeUri = Uri.from({
      ...this.codeUri.toJSON(),
      scheme: this.codeUri.scheme,
      path: path.toString()
    });
    return new URI(newCodeUri);
  }

  /**
   * return this URI without a path
   */
  withoutPath(): URI {
    return this.withPath('');
  }

  /**
   * return a new URI replacing the current with the given query
   */
  withQuery(query: string): URI {
    const newCodeUri = Uri.from({
      ...this.codeUri.toJSON(),
      scheme: this.codeUri.scheme,
      query
    });
    return new URI(newCodeUri);
  }

  /**
   * return this URI without a query
   */
  withoutQuery(): URI {
    return this.withQuery('');
  }

  /**
   * return a new URI replacing the current with the given fragment
   */
  withFragment(fragment: string): URI {
    const newCodeUri = Uri.from({
      ...this.codeUri.toJSON(),
      scheme: this.codeUri.scheme,
      fragment
    });
    return new URI(newCodeUri);
  }

  /**
   * return this URI without a fragment
   */
  withoutFragment(): URI {
    return this.withFragment('');
  }

  get scheme(): string {
    return this.codeUri.scheme;
  }

  get authority(): string {
    return this.codeUri.authority;
  }

  get path(): Path {
    if (this._path === undefined) {
      this._path = new Path(this.codeUri.path);
    }
    return this._path;
  }

  get query(): string {
    return this.codeUri.query;
  }

  get fragment(): string {
    return this.codeUri.fragment;
  }

  toString(skipEncoding?: boolean) {
    return this.codeUri.toString(skipEncoding);
  }

  isEqualOrParent(uri: URI): boolean {
    return this.authority === uri.authority && this.scheme === uri.scheme && this.path.isEqualOrParent(uri.path);
  }

  static getDistinctParents(uris: URI[]): URI[] {
    const result: URI[] = [];
    uris.forEach((uri, i) => {
      if (!uris.some((otherUri, index) => index !== i && otherUri.isEqualOrParent(uri))) {
        result.push(uri);
      }
    });
    return result;
  }

}
