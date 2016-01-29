import path from 'path';
import {expect} from 'chai';
import requireSilent from '../../../../src/resource/lib/require_silent';

describe('requireSilent', () => {

  it('should require a file', () => {
    var packagePath = path.resolve('./package');
    expect(requireSilent(packagePath)).to.deep.equal(require(packagePath));
  });

  it('should not throw if file is not found', () => {
    expect(() => {
      requireSilent('path/to/nowhere');
    }).to.not.throw;
  });

  it('should return error if file is not found', () => {
    expect(requireSilent('path/to/nowhere')).to.be.an.instanceof(Error);
  });

});
