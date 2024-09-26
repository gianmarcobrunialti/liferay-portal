package com.liferay.commerce.order.content.web.internal.frontend.data.set.view.table;

import com.liferay.commerce.order.content.web.internal.constants.CommerceOrderFragmentFDSNames;
import com.liferay.frontend.data.set.view.FDSView;
import com.liferay.frontend.data.set.view.table.BaseTableFDSView;
import com.liferay.frontend.data.set.view.table.FDSTableSchema;
import com.liferay.frontend.data.set.view.table.FDSTableSchemaBuilder;
import com.liferay.frontend.data.set.view.table.FDSTableSchemaBuilderFactory;
import com.liferay.frontend.data.set.view.table.StringFDSTableSchemaField;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;

import java.util.Locale;

@Component(
	property = "frontend.data.set.name=" + CommerceOrderFragmentFDSNames.PENDING_ORDERS,
	service = FDSView.class
)
public class PendingCommerceOrderFragmentTableFDSView extends BaseTableFDSView {

	@Override
	public FDSTableSchema getFDSTableSchema(Locale locale) {
		FDSTableSchemaBuilder fdsTableSchemaBuilder =
			_fdsTableSchemaBuilderFactory.create();

		return fdsTableSchemaBuilder.add(
			"id", "order-id",
			fdsTableSchemaField -> fdsTableSchemaField.setContentRenderer(
				"actionLink")
		).add(
			"name", "name",
			fdsTableSchemaField -> fdsTableSchemaField.setSortable(true)
		).add(
			"orderType", "order-type",
			fdsTableSchemaField -> fdsTableSchemaField.setSortable(true)
		).add(
			"externalReferenceCode", "erc",
			fdsTableSchemaField -> fdsTableSchemaField.setSortable(true)
		).add(
			"purchaseOrderNumber", "purchase-order-number"
		).add(
			"createDate", "date",
			fdsTableSchemaField -> {
				fdsTableSchemaField.setContentRenderer("date");
				fdsTableSchemaField.setSortable(true);
			}
		).add(
			_addAccountNameStringFDSTableSchemaField()
		).add(
			"author", "created-by",
			fdsTableSchemaField -> fdsTableSchemaField.setSortable(true)
		).add(
			"workflowStatusInfo.label_i18n", "status",
			fdsTableSchemaField -> fdsTableSchemaField.setContentRenderer("label")
		).add(
			"summary.totalFormatted", "amount",
			fdsTableSchemaField -> fdsTableSchemaField.setSortable(true)
		).build();
	}

	private StringFDSTableSchemaField
	_addAccountNameStringFDSTableSchemaField() {

		StringFDSTableSchemaField stringFDSTableSchemaField =
			new StringFDSTableSchemaField();

		stringFDSTableSchemaField.setFieldName("account");
		stringFDSTableSchemaField.setLabel("account");
		stringFDSTableSchemaField.setTruncate(true);

		return stringFDSTableSchemaField;
	}

	@Reference
	private FDSTableSchemaBuilderFactory _fdsTableSchemaBuilderFactory;

}
