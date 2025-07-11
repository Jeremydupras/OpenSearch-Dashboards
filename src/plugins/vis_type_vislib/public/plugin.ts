/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import './index.scss';

import {
  CoreSetup,
  CoreStart,
  Plugin,
  IUiSettingsClient,
  PluginInitializerContext,
} from 'opensearch-dashboards/public';

import { VisTypeXyPluginSetup } from 'src/plugins/vis_type_xy/public';
import { Plugin as ExpressionsPublicPlugin } from '../../expressions/public';
import { VisualizationsSetup } from '../../visualizations/public';
import { createVisTypeVislibVisFn } from './vis_type_vislib_vis_fn';
import { createPieVisFn } from './pie_fn';
import {
  createHistogramVisTypeDefinition,
  createLineVisTypeDefinition,
  createPieVisTypeDefinition,
  createAreaVisTypeDefinition,
  createHeatmapVisTypeDefinition,
  createHorizontalBarVisTypeDefinition,
  createGaugeVisTypeDefinition,
  createGoalVisTypeDefinition,
} from './vis_type_vislib_vis_types';
import { ChartsPluginSetup } from '../../charts/public';
import { DataPublicPluginStart } from '../../data/public';
import { setFormatService, setDataActions, setOpenSearchDashboardsLegacy } from './services';
import { OpenSearchDashboardsLegacyStart } from '../../opensearch_dashboards_legacy/public';

export interface VisTypeVislibDependencies {
  uiSettings: IUiSettingsClient;
  charts: ChartsPluginSetup;
}

/** @internal */
export interface VisTypeVislibPluginSetupDependencies {
  expressions: ReturnType<ExpressionsPublicPlugin['setup']>;
  visualizations: VisualizationsSetup;
  charts: ChartsPluginSetup;
  visTypeXy?: VisTypeXyPluginSetup;
}

/** @internal */
export interface VisTypeVislibPluginStartDependencies {
  data: DataPublicPluginStart;
  opensearchDashboardsLegacy: OpenSearchDashboardsLegacyStart;
}

type VisTypeVislibCoreSetup = CoreSetup<VisTypeVislibPluginStartDependencies, void>;

/** @internal */
export class VisTypeVislibPlugin implements Plugin<void, void> {
  constructor(public initializerContext: PluginInitializerContext) {}

  public async setup(
    core: VisTypeVislibCoreSetup,
    { expressions, visualizations, charts, visTypeXy }: VisTypeVislibPluginSetupDependencies
  ) {
    const visualizationDependencies: Readonly<VisTypeVislibDependencies> = {
      uiSettings: core.uiSettings,
      charts,
    };
    const vislibTypes = [
      createHistogramVisTypeDefinition,
      createLineVisTypeDefinition,
      createPieVisTypeDefinition,
      createAreaVisTypeDefinition,
      createHeatmapVisTypeDefinition,
      createHorizontalBarVisTypeDefinition,
      createGaugeVisTypeDefinition,
      createGoalVisTypeDefinition,
    ];
    const vislibFns = [createVisTypeVislibVisFn(), createPieVisFn()];

    // if visTypeXy plugin is disabled it's config will be undefined
    if (!visTypeXy) {
      const convertedTypes: any[] = [];
      const convertedFns: any[] = [];

      // Register legacy vislib types that have been converted
      convertedFns.forEach(expressions.registerFunction);
      convertedTypes.forEach((vis) =>
        visualizations.createBaseVisualization(vis(visualizationDependencies))
      );
    }

    // Register non-converted types
    vislibFns.forEach(expressions.registerFunction);
    vislibTypes.forEach((vis) =>
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      visualizations.createBaseVisualization(vis(visualizationDependencies))
    );
  }

  public start(
    core: CoreStart,
    { data, opensearchDashboardsLegacy }: VisTypeVislibPluginStartDependencies
  ) {
    setFormatService(data.fieldFormats);
    setDataActions(data.actions);
    setOpenSearchDashboardsLegacy(opensearchDashboardsLegacy);
  }
}
