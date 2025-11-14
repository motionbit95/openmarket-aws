"use client";

import { useBoolean } from "minimal-shared/hooks";
import { useState } from "react";
import GenericListView from "src/components/list/generic-list-view";
import { GenericTableRow } from "src/components/list/generic-table-row";
import { paths } from "src/routes/paths";

// 테이블 헤더 정의
const TABLE_HEAD = [
  { id: "id", label: "No.", width: 60 },
  { id: "title", label: "제목", width: 200 },
  { id: "created_at", label: "작성일", width: 100 },
  { id: "updated_at", label: "수정일", width: 100 },
  { id: "", width: 88 },
];

export default function GuideListView({ type }) {
  const viewDialog = useBoolean();
  const [selectedId, setSelectedId] = useState(null);

  return (
    <GenericListView
      // fetchData={getNoticesByType} // 임시
      tableHead={TABLE_HEAD}
      createButtonPath={`${paths.dashboard.inquiry.new}/${type}`}
      renderRow={({ row, selected, onSelectRow }) => (
        <GenericTableRow
          row={row}
          selected={selected}
          onSelectRow={onSelectRow}
          onDeleteRow={onDeleteRow}
          onViewOpen={() => viewDialog.onTrue()}
          viewDialogComponent={({ viewDialog, dataId }) => (
            <CommonDialogView
              viewDialog={viewDialog}
              itemId={selectedId}
              // fetchDataById={getNoticeById} // 임시
            />
          )}
          editPath={paths.dashboard.inquiry.edit}
        />
      )}
    />
  );
}
