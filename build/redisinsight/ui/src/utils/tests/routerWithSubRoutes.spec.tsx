import React from 'react'
import Router from 'uiSrc/Router'
import { render } from 'uiSrc/utils/test-utils'
import RouteWithSubRoutes from 'uiSrc/utils/routerWithSubRoutes'
import ROUTES from 'uiSrc/components/main-router/constants/commonRoutes'

describe('RouteWithSubRoutes', () => {
  it('should render', () => {
    expect(render(
      <Router>
        <RouteWithSubRoutes
          key={1}
          {...ROUTES[0]}
        />
      </Router>
    )).toBeTruthy()
  })
})
