"use client";

import { useBoolean } from "minimal-shared/hooks";
import { useEffect, useState } from "react";
import { paths } from "src/routes/paths";
import ListView from "../list/list";
import { TableRowView } from "../list/table-row";
import { DialogView } from "../list/dialog";
import { getNoticeById } from "src/actions/notices";

// 테이블 헤더 정의
const TABLE_HEAD = [
  { id: "id", label: "no.", width: 100 },
  { id: "title", label: "제목", width: 200 },
  { id: "category", label: "카테고리", width: 150 },
  { id: "created_at", label: "작성일시", width: 100 },
  { id: "", width: 88 },
];

export default function NoticeListView({ type }) {
  const viewDialog = useBoolean();
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <ListView
        // dummyData={dummyData}
        tableHead={TABLE_HEAD}
        type={type}
        renderRow={({ row, selected, onSelectRow, onDeleteRow }) => (
          <TableRowView
            row={row}
            key={row.id}
            selected={selected}
            onSelectRow={onSelectRow}
            onDeleteRow={onDeleteRow}
            onViewOpen={() => {
              setSelectedId(row.id);
              viewDialog.onTrue();
            }}
            // viewDialogComponent={({ viewDialog, dataId }) => (
            //   <DialogView
            //     viewDialog={viewDialog}
            //     dataId={selectedId}
            //     fetchDataById={getNoticeById} // 임시
            //   />
            // )}
            tableHead={TABLE_HEAD}
          />
        )}
      />

      {/* 뷰 다이얼로그 */}
      {viewDialog.value && (
        <DialogView
          viewDialog={viewDialog}
          dataId={selectedId}
          fetchDataById={getNoticeById} // 임시
        />
      )}
    </>
  );
}
