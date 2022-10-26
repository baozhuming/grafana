import { M } from 'msw/lib/glossary-dc3fd077';
import { Subject } from 'rxjs';

import { LoadingState } from '@grafana/data';

import { SceneObjectBase } from '../core/SceneObjectBase';
import { SceneObjectStatePlain } from '../core/types';

import { SceneVariablesManager } from './SceneVariablesManager';
import { TestVariable } from './TestVariable';
import { VariableUpdateProcess } from './VariableUpdateProcess';

interface TestSceneState extends SceneObjectStatePlain {
  nested?: TestScene;
}

class TestScene extends SceneObjectBase<TestSceneState> {}

describe('VariableUpdateProcess', () => {
  it('should figure out dependencies and update in order', async () => {
    const server = new TestVariable({ name: 'server', query: 'A.*', value: 'server-initial', text: '', options: [] });
    const pod = new TestVariable({ name: 'pod', query: 'A.$server.*', value: 'pod-initial', text: '', options: [] });

    const variables = new SceneVariablesManager({
      variables: [server, pod],
    });

    const scene = new TestScene({ $variables: variables });
    const updateProcess = new VariableUpdateProcess(scene);

    updateProcess.addVariable(server, pod);
    updateProcess.updateTick();

    expect(server.state.state).toBe(LoadingState.Loading);
    expect(pod.state.state).toBe(undefined);

    server.signalUpdateCompleted();

    expect(server.state.value).toBe('AA');
    expect(server.state.issuedQuery).toBe('A.*');
    expect(server.state.state).toBe(LoadingState.Done);

    expect(pod.state.state).toBe(LoadingState.Loading);

    pod.signalUpdateCompleted();
    expect(pod.state.value).toBe('AAA');
    expect(pod.state.state).toBe(LoadingState.Done);
  });

  it('Complex dependency order', async () => {
    const A = new TestVariable({ name: 'A', query: 'A.*', value: '', text: '', options: [] });
    const B = new TestVariable({ name: 'B', query: 'B.*', value: '', text: '', options: [] });
    const C = new TestVariable({ name: 'C', query: '$A.$B.*', value: '', text: '', options: [] });

    const variables = new SceneVariablesManager({
      variables: [C, B, A],
    });

    const scene = new TestScene({ $variables: variables });
    const updateProcess = new VariableUpdateProcess(scene);

    updateProcess.addVariable(A, B, C);
    updateProcess.updateTick();

    expect(A.state.state).toBe(LoadingState.Loading);
    expect(B.state.state).toBe(LoadingState.Loading);
    expect(C.state.state).toBe(undefined);

    A.signalUpdateCompleted();
    expect(C.state.state).toBe(undefined);

    B.signalUpdateCompleted();
    expect(C.state.state).toBe(LoadingState.Loading);

    C.signalUpdateCompleted();
    expect(C.state.issuedQuery).toBe('AA.BA.*');
  });
});
