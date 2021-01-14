<%--
/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */
--%>

<%@ include file="/product_card/init.jsp" %>

<%
String localizedLabel = LanguageUtil.get(request, "compare");
String productImageURL = (String) displayProductInformation.get("productImageURL");
long skuId = (long) displayProductInformation.get("skuId");
%>

<div class="autofit-col autofit-col-expand compare-checkbox">
	<div class="autofit-section">
		<div class="custom-checkbox custom-control custom-control-primary">
			<div class="custom-control custom-checkbox">
				<label>
					<input alt="<%= localizedLabel %>"
						   class="compare-checkbox-input custom-control-input"
						   onclick="Liferay.fire('toggleProductToCompare', {id: <%= skuId %>, thumbnail: '<%= productImageURL %>' || null});"
						   type="checkbox"
					/>
					<span class="custom-control-label text-truncate-inline">
						<span class="custom-control-label-text text-truncate font-weight-normal">
							<%= localizedLabel %>
						</span>
					</span>
				</label>
			</div>
		</div>
	</div>
</div>